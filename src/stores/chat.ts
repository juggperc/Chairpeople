import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuid } from 'uuid';
import type { Message, Conversation } from '@/types';

interface ChatState {
  orchestrationMessages: Message[];
  activeConversationId: string | null;
  conversations: Record<string, Conversation>;
  messagesByConversation: Record<string, Message[]>;
  addOrchestrationMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateOrchestrationMessage: (id: string, content: string) => void;
  clearOrchestrationMessages: () => void;
  createConversation: (companyId: string, type: Conversation['type'], participantIds: string[]) => Conversation;
  getConversation: (id: string) => Conversation | null;
  getMessages: (conversationId: string) => Message[];
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (conversationId: string, id: string, content: string) => void;
  clearConversation: (conversationId: string) => void;
  setActiveConversation: (id: string | null) => void;
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    orchestrationMessages: [],
    activeConversationId: null,
    conversations: {},
    messagesByConversation: {},

    addOrchestrationMessage: (message) => {
      const id = uuid();
      const timestamp = new Date().toISOString();
      set((state) => {
        state.orchestrationMessages.push({ ...message, id, timestamp });
      });
      return id;
    },

    updateOrchestrationMessage: (id, content) => {
      set((state) => {
        const msg = state.orchestrationMessages.find(m => m.id === id);
        if (msg) {
          msg.content = content;
        }
      });
    },

    clearOrchestrationMessages: () => {
      set((state) => {
        state.orchestrationMessages = [];
      });
    },

    createConversation: (companyId, type, participantIds) => {
      const id = uuid();
      const now = new Date().toISOString();
      const conversation: Conversation = {
        id,
        companyId,
        type,
        participantIds,
        createdAt: now,
        updatedAt: now,
      };
      set((state) => {
        state.conversations[id] = conversation;
        state.messagesByConversation[id] = [];
        state.activeConversationId = id;
      });
      return conversation;
    },

    getConversation: (id) => {
      return get().conversations[id] ?? null;
    },

    getMessages: (conversationId) => {
      return get().messagesByConversation[conversationId] ?? [];
    },

    addMessage: (conversationId, message) => {
      const id = uuid();
      const timestamp = new Date().toISOString();
      set((state) => {
        if (!state.messagesByConversation[conversationId]) {
          state.messagesByConversation[conversationId] = [];
        }
        state.messagesByConversation[conversationId].push({ ...message, id, timestamp });
        if (state.conversations[conversationId]) {
          state.conversations[conversationId].updatedAt = timestamp;
        }
      });
      return id;
    },

    updateMessage: (conversationId, id, content) => {
      set((state) => {
        const messages = state.messagesByConversation[conversationId];
        if (messages) {
          const msg = messages.find(m => m.id === id);
          if (msg) {
            msg.content = content;
          }
        }
      });
    },

    clearConversation: (conversationId) => {
      set((state) => {
        state.messagesByConversation[conversationId] = [];
      });
    },

    setActiveConversation: (id) => {
      set((state) => {
        state.activeConversationId = id;
      });
    },
  }))
);