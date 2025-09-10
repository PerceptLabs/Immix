/**
 * Message Store - Core Chat Functionality
 * 
 * This store manages all message-related state and operations.
 * It's the heart of the chat system, handling:
 * - Message sending and receiving
 * - Real-time streaming responses
 * - Message history management
 * - Local storage fallback
 * - Error handling and retries
 * 
 * Architecture:
 * - Uses Map for efficient conversation-based message storage
 * - Integrates with agent and conversation stores
 * - Handles both streaming and non-streaming API responses
 * - Provides local storage backup for offline access
 * 
 * Key Features:
 * - Automatic conversation creation if needed
 * - Streaming with fallback to non-streaming
 * - Optimistic UI updates
 * - Message feedback tracking
 * - File upload support
 * 
 * Features:
 * - Real-time streaming with local storage persistence
 * - Robust error handling with graceful fallbacks
 * - Comprehensive logging and debugging support
 * - Optimistic UI updates with consistent message ordering
 */

import { create } from 'zustand';
import type { MessageStore, ChatMessage, Citation, FeedbackType, MessageDetails, MessageMetadata } from '@/types';
import { useConversationStore } from './conversations';
import { generateId } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

/**
 * Local storage configuration
 * Provides offline access and caching for better UX
 */
const MESSAGES_STORAGE_KEY = 'immix-messages-cache';

/**
 * Save messages to local storage
 * Provides a fallback when API is unavailable
 * @param conversationId - The conversation to save messages for
 * @param messages - Array of messages to save
 */
function saveMessagesToStorage(conversationId: string, messages: ChatMessage[]) {
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    const cache = stored ? JSON.parse(stored) : {};
    cache[conversationId] = messages;
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    // Silent fail - storage is optional
  }
}

/**
 * Load messages from local storage
 * Used as fallback when API is unavailable
 * @param conversationId - The conversation to load messages for
 * @returns Array of messages or null if not found
 */
function loadMessagesFromStorage(conversationId: string): ChatMessage[] | null {
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!stored) return null;
    const cache = JSON.parse(stored);
    return cache[conversationId] || null;
  } catch (error) {
    // Silent fail - storage is optional
    return null;
  }
}

/**
 * Message Store Implementation
 * 
 * State Structure:
 * - messages: Map<conversationId, ChatMessage[]> - All messages grouped by conversation
 * - streamingMessage: Current message being streamed (null when not streaming)
 * - isStreaming: Whether a message is currently being streamed
 * - loading: General loading state for message operations
 * - error: Current error message if any
 */
export const useMessageStore = create<MessageStore>((set, get) => ({
  // Initialize with empty state
  messages: new Map(),
  streamingMessage: null,
  isStreaming: false,
  loading: false,
  error: null,

  /**
   * Send a message to the current agent
   * 
   * @param content - Message text
   */
  sendMessage: async (content: string) => {
    const conversationStore = useConversationStore.getState();
    const { currentConversation } = conversationStore;

    if (!currentConversation) {
      throw new Error('No conversation selected');
    }

    set({ loading: true, error: null });

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    get().addMessage(currentConversation.id.toString(), userMessage);

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      citations: [],
    };

    set({ 
      streamingMessage: assistantMessage,
      isStreaming: true,
      loading: false,
    });

    try {
      userMessage.status = 'sent';
      get().addMessage(currentConversation.id.toString(), userMessage);

      const allMessages = get().messages.get(currentConversation.id.toString()) || [];

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: currentConversation.id,
          messages: allMessages,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                get().updateStreamingMessage(data.text);
              }
            } catch (e) {
              console.error('Failed to parse stream chunk', e);
            }
          }
        }
      }

      const finalMessage = get().streamingMessage;
      if (finalMessage) {
        finalMessage.status = 'sent';
        get().addMessage(currentConversation.id.toString(), finalMessage);
      }

      set({
        streamingMessage: null,
        isStreaming: false,
      });
    } catch (error: any) {
      logger.error('MESSAGES', 'Failed to send message', error);
      
      userMessage.status = 'error';
      get().addMessage(currentConversation.id.toString(), userMessage);
      
      set({ 
        streamingMessage: null,
        isStreaming: false,
        error: error.message || 'Failed to send message',
        loading: false,
      });
      
      throw error;
    }
  },

  /**
   * Add or update a message in the store
   * 
   * @param conversationId - The conversation to add the message to
   * @param message - The message to add or update
   */
  addMessage: (conversationId: string, message: ChatMessage) => {
    set(state => {
      const newMessages = new Map(state.messages);
      const conversationMessages = newMessages.get(conversationId) || [];
      
      const existingIndex = conversationMessages.findIndex(m => m.id === message.id);
      if (existingIndex >= 0) {
        conversationMessages[existingIndex] = message;
      } else {
        conversationMessages.push(message);
      }
      
      newMessages.set(conversationId, conversationMessages);
      
      saveMessagesToStorage(conversationId, conversationMessages);
      
      return { messages: newMessages };
    });
  },

  /**
   * Update the currently streaming message
   * 
   * @param content - Content chunk to append
   */
  updateStreamingMessage: (content: string) => {
    set(state => {
      if (!state.streamingMessage) return state;
      
      return {
        streamingMessage: {
          ...state.streamingMessage,
          content: state.streamingMessage.content + content,
        },
      };
    });
  },

  clearMessages: (conversationId?: string) => {
    set(state => {
      if (conversationId) {
        const newMessages = new Map(state.messages);
        newMessages.delete(conversationId);
        return { messages: newMessages };
      } else {
        return { messages: new Map() };
      }
    });
  },

  loadMessages: async (conversationId: string) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/messages?conversation=${conversationId}`);
      const messages = await response.json();

      set(state => {
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, messages);
        return { 
          messages: newMessages,
          loading: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load messages',
        loading: false,
      });
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  setMessagesForConversation: (conversationId: string, messages: ChatMessage[]) => {
    set(state => {
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, messages);
      return { messages: newMessages };
    });
  },
}));