import { NextRequest, NextResponse } from 'next/server';
import {
  sendChatMessage,
  generateContextualPrompt,
  getFallbackResponse,
} from '@/lib/openrouter';
import { Message } from '@/types';

// Rate limiting variables
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute
const ipRequests = new Map<string, { count: number; timestamp: number }>();

// Helper function to enforce rate limiting
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const clientData = ipRequests.get(ip);

  if (!clientData) {
    // First request from this IP
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (now - clientData.timestamp > RATE_LIMIT_WINDOW) {
    // Window has passed, reset counter
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }

  // Increment counter
  clientData.count++;
  ipRequests.set(ip, clientData);

  // Check if over limit
  return clientData.count > MAX_REQUESTS_PER_WINDOW;
}

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW * 5) {
      ipRequests.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { messages, subject, difficulty } = await request.json();

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Valid messages array is required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      // In production, don't leak information about missing API key
      return NextResponse.json({
        message: getFallbackResponse(
          messages[messages.length - 1]?.content || ''
        ),
      });
    }

    // Convert our message format to OpenRouter format with proper type handling
    const chatMessages = messages.map((msg: Message) => {
      // Ensure role is properly cast to a valid OpenRouter role
      let role: 'system' | 'user' | 'assistant';
      if (msg.role === 'user') {
        role = 'user';
      } else if (msg.role === 'assistant') {
        role = 'assistant';
      } else {
        // Default to user if role is unexpected
        role = 'user';
      }

      return {
        role,
        content: msg.content,
      };
    });

    // Ensure we're sending the full conversation history for context
    // If it's very long, we might limit it to the last 15 messages
    const contextMessages =
      chatMessages.length > 15
        ? chatMessages.slice(chatMessages.length - 15)
        : chatMessages;

    // Generate contextual system prompt
    const systemPrompt = generateContextualPrompt(subject, difficulty);

    try {
      // Send request to OpenRouter with proper system prompt and subject/difficulty
      const response = await sendChatMessage(contextMessages, {
        temperature: 0.7,
        maxTokens: 800, // Increased max tokens for more complete responses
        systemPrompt: systemPrompt,
      });

      return NextResponse.json({ message: response });
    } catch (apiError) {
      // Check if error is a rate limit error
      const errorMessage =
        apiError instanceof Error ? apiError.message : String(apiError);

      if (
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests')
      ) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }

      // For other errors, return a user-friendly message
      return NextResponse.json(
        {
          error: 'AI service error',
          message: getFallbackResponse(
            messages[messages.length - 1]?.content || ''
          ),
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          "I'm having some technical difficulties right now. Please try again in a moment!",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
