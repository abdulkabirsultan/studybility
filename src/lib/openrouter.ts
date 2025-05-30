import { OpenRouterResponse } from '@/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'deepseek/deepseek-chat-v3-0324:free';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second


const SYSTEM_PROMPT = `You are a patient, encouraging AI tutor specifically designed to help students with learning disabilities. Your role is to:

1. **Break down complex concepts** into simple, manageable steps
2. **Use analogies and real-world examples** that are easy to understand
3. **Provide multiple explanations** for the same concept using different approaches
4. **Ask clarifying questions** to ensure understanding before moving forward
5. **Celebrate progress** and encourage the student with positive reinforcement
6. **Adapt your teaching style** based on the student's responses and needs
7. **Use clear, simple language** and avoid jargon unless necessary (and then explain it)
8. **Be patient** and never make the student feel rushed or inadequate
9. **Offer memory aids** like mnemonics, visual descriptions, or step-by-step guides
10. **Check for understanding** regularly and invite questions

Remember:
- Every student learns differently, so be flexible in your approach
- Some students may need more time to process information
- Visual learners benefit from descriptive explanations
- Kinesthetic learners benefit from hands-on examples
- Always be encouraging and supportive
- If a student seems frustrated, take a step back and try a different approach
- Use positive language and avoid negative phrasing

Keep responses conversational, encouraging, and appropriately detailed for the difficulty level selected.`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Sleep function for implementing delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a chat message to OpenRouter API with simple error handling
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    systemPrompt?: string;
  } = {}
): Promise<string> {
  const {
    temperature = 0.7,
    maxTokens = 800,
    stream = false,
    systemPrompt = SYSTEM_PROMPT,
  } = options;

  // Validate input
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('Valid messages array is required');
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'AI Study Buddy - Learning Support Tool',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Simple error handling without retries
    if (!response.ok) {
      const statusCode = response.status;

      // Try to get detailed error message
      let errorMessage = `Error ${statusCode}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (parseError) {
        // Ignore JSON parsing errors
      }

      // For rate limiting errors
      if (statusCode === 429 || statusCode === 409) {
        throw new Error(
          'The AI service is currently busy. Please try again in a moment.'
        );
      }

      // For auth errors
      if (statusCode === 401 || statusCode === 403) {
        throw new Error('Authentication error with AI service.');
      }

      // For server errors
      if (statusCode >= 500) {
        throw new Error('AI service is temporarily unavailable.');
      }

      // For any other errors
      throw new Error(
        errorMessage || `Error communicating with AI service (${statusCode})`
      );
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response generated from the AI model');
    }

    return data.choices[0].message.content;
  } catch (error) {
    // Handle network errors or timeouts
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }

      if (error.message.includes('fetch')) {
        throw new Error('Network error connecting to AI service.');
      }
    }

    // Rethrow the error to be handled by the caller
    throw error;
  }
}

/**
 * Generate a contextual system prompt based on subject and difficulty
 */
export function generateContextualPrompt(
  subject?: string,
  difficulty?: string,
  userPreferences?: any
): string {
  let contextPrompt = SYSTEM_PROMPT;

  if (subject) {
    contextPrompt += `\n\nThe student is currently studying ${subject}. Tailor your explanations to this subject area and use relevant examples.`;
  }

  if (difficulty) {
    switch (difficulty) {
      case 'beginner':
        contextPrompt +=
          '\n\nThis student is at a beginner level. Use very simple language, basic concepts, and plenty of encouragement. Start with fundamental principles.';
        break;
      case 'intermediate':
        contextPrompt +=
          '\n\nThis student is at an intermediate level. You can use moderate complexity but still break things down clearly. Build on foundational knowledge.';
        break;
      case 'advanced':
        contextPrompt +=
          '\n\nThis student is at an advanced level. You can discuss more complex concepts but still maintain clarity and provide detailed explanations.';
        break;
    }
  }

  return contextPrompt;
}

/**
 * Get fallback response when API is unavailable
 */
export function getFallbackResponse(userMessage: string): string {
  const fallbackResponses = [
    "I'm having trouble connecting to my learning resources right now, but I'm still here to help! Could you tell me more about what you'd like to learn?",
    "It looks like I'm experiencing some technical difficulties, but don't worry! Let's work through this together. What specific topic are you working on?",
    "I apologize for the technical issue I'm having. While I get that sorted out, could you share more details about what you're studying? I want to make sure I can help you as soon as possible!",
    'There seems to be a temporary connection issue on my end. In the meantime, could you break down your question into smaller parts? Sometimes that helps us tackle problems step by step!',
    "I'm experiencing a brief technical hiccup, but I'm committed to helping you learn! Could you rephrase your question or tell me which part is most confusing?",
  ];

  return fallbackResponses[
    Math.floor(Math.random() * fallbackResponses.length)
  ];
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  return (
    typeof apiKey === 'string' && apiKey.length > 10 && apiKey.startsWith('sk-')
  );
}
