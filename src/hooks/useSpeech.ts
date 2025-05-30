'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  sanitizeForSpeech,
  supportsSpeechSynthesis,
  supportsSpeechRecognition,
} from '@/lib/utils';

/**
 * Hook for text-to-speech functionality
 */
export function useTextToSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices when component mounts
  useEffect(() => {
    setIsSupported(supportsSpeechSynthesis());

    if (supportsSpeechSynthesis()) {
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Set default voice (prefer English voices)
        if (availableVoices.length > 0 && !selectedVoice) {
          const englishVoice =
            availableVoices.find(
              (voice) => voice.lang.startsWith('en') && voice.localService
            ) || availableVoices[0];
          setSelectedVoice(englishVoice);
        }
      };

      loadVoices();
      speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, [selectedVoice]);

  // Speak text function
  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) {
        console.error('Speech synthesis not supported or no text provided');
        return;
      }

      try {
        // Stop any ongoing speech
        speechSynthesis.cancel();

        const sanitizedText = sanitizeForSpeech(text);
        console.log('Speaking text:', sanitizedText.substring(0, 50) + '...');

        const utterance = new SpeechSynthesisUtterance(sanitizedText);

        utterance.voice = selectedVoice;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        utterance.onstart = () => {
          console.log('Speech started');
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          console.log('Speech ended');
          setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
          console.error('Speech error:', event);
          setIsSpeaking(false);
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error during speech synthesis:', error);
        setIsSpeaking(false);
      }
    },
    [isSupported, selectedVoice, rate, pitch, volume]
  );

  // Stop speaking function
  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  // Pause speaking function
  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking]);

  // Resume speaking function
  const resume = useCallback(() => {
    if (isSupported) {
      speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    speak,
    stop,
    pause,
    resume,
  };
}

/**
 * Hook for speech-to-text functionality
 */
export function useSpeechToText() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 3;

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      setIsOnline(true);
      setError(null);

      // If we were listening when the connection was lost, try to restart
      if (isListening) {
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start();
              console.log(
                'Automatically restarting speech recognition after connection restored'
              );
            }
          } catch (err) {
            console.error(
              'Failed to restart speech recognition after connection restored:',
              err
            );
          }
        }, 1000);
      }
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      setIsOnline(false);
      if (isListening) {
        setError('Network connection lost. Speech recognition paused.');
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (err) {
            console.error(
              'Error stopping recognition after network disconnect:',
              err
            );
          }
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize with current network status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isListening]);

  useEffect(() => {
    const supported = supportsSpeechRecognition();
    setIsSupported(supported);
    console.log('Speech recognition support detected:', supported);

    if (supported) {
      try {
        // Create speech recognition instance
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // Add additional configuration to reduce network errors
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          const newTranscript = finalTranscript || interimTranscript;
          console.log('Speech recognized:', newTranscript);
          setTranscript(newTranscript);
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);

          // Special handling for network errors
          if (event.error === 'network') {
            console.log('Attempting to recover from network error...');

            // Set a more specific error message
            setError(
              'Network connection issue detected. Please check your internet connection.'
            );

            // Stop the current recognition instance
            if (isListening) {
              recognition.stop();
            }

            // Attempt to restart after a short delay if still listening
            if (isListening) {
              setTimeout(() => {
                try {
                  recognition.start();
                  console.log(
                    'Restarting speech recognition after network error'
                  );
                } catch (e) {
                  console.error('Failed to restart speech recognition:', e);
                  setIsListening(false);
                  setError(
                    'Failed to restart speech recognition after network error'
                  );
                }
              }, 1000);
            }
          } else {
            // Handle other errors normally
            setIsListening(false);
            setError(getErrorMessage(event.error));
          }
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.error('Error initializing speech recognition:', err);
        setIsSupported(false);
        setError('Failed to initialize speech recognition');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      console.error('Speech recognition not supported or not initialized');
      setError('Speech recognition not available in this browser');
      return;
    }

    setTranscript('');
    setError(null);
    reconnectAttemptsRef.current = 0;

    try {
      console.log('Attempting to start speech recognition...');

      // Check if the browser is online before attempting to start
      if (!navigator.onLine) {
        setError(
          'Your device appears to be offline. Please check your internet connection.'
        );
        return;
      }

      // Some browsers might throw if starting recognition when it's already running
      if (recognitionRef.current.state === 'running') {
        recognitionRef.current.stop();
      }

      // Add a small delay to ensure any previous instance is fully stopped
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error('Failed to start speech recognition (retry):', err);
          setError('Failed to start speech recognition. Please try again.');
          setIsListening(false);
        }
      }, 100);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('Speech recognition stopped manually');
        // Ensure state is reset
        setIsListening(false);
        // We don't reset transcript here as we want to keep what was recognized
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        // Force the UI to show as not listening even if the stop call failed
        setIsListening(false);
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    isOnline,
    startListening,
    stopListening,
    resetTranscript,
  };
}

/**
 * Get user-friendly error message for speech recognition errors
 */
function getErrorMessage(error: string): string {
  switch (error) {
    case 'network':
      return 'Network connection issue detected. Please check your internet connection and try again.';
    case 'not-allowed':
      return 'Microphone access was denied. Please allow microphone access to use speech input.';
    case 'no-speech':
      return 'No speech was detected. Please try again and speak clearly into your microphone.';
    case 'aborted':
      return 'Speech recognition was aborted.';
    case 'audio-capture':
      return "Audio capture failed. Please check your microphone and ensure it's properly connected.";
    case 'service-not-allowed':
      return 'Speech recognition service is not allowed in this browser or context.';
    case 'bad-grammar':
      return 'Speech recognition grammar error. Please try again.';
    case 'language-not-supported':
      return 'The specified language is not supported. Using default language instead.';
    default:
      return `An error occurred during speech recognition (${error}). Please try again.`;
  }
}

// Add TypeScript declarations for Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
