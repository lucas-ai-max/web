import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Chat, Message, DebateConfig, Folder } from './types';
import { AGENTS } from './constants';

interface AppState {
  chats: Chat[];
  folders: Folder[];
  currentChatId: string | null;
  selectedFolderId: string | null;
  selectedAgents: string[];
  numRodadas: number;
  isDebating: boolean;
  
  // Actions
  setSelectedAgents: (agents: string[]) => void;
  setNumRodadas: (rodadas: number) => void;
  createChat: (config: DebateConfig) => string;
  addMessage: (chatId: string, message: Message) => void;
  setCurrentChat: (chatId: string | null) => void;
  deleteChat: (chatId: string) => void;
  setIsDebating: (debating: boolean) => void;
  getCurrentChat: () => Chat | null;
  updateChatDebateId: (chatId: string, debateId: string) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  // Folder actions
  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  updateFolder: (folderId: string, updates: Partial<Folder>) => void;
  deleteFolder: (folderId: string) => void;
  setSelectedFolder: (folderId: string | null) => void;
  moveChatToFolder: (chatId: string, folderId: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      chats: [],
      folders: [],
      currentChatId: null,
      selectedFolderId: null,
      selectedAgents: [],
      numRodadas: 2,
      isDebating: false,

      setSelectedAgents: (agents) => set({ selectedAgents: agents }),
      
      setNumRodadas: (rodadas) => set({ numRodadas: rodadas }),
      
      createChat: (config) => {
        const chatId = Date.now().toString();
        const title = config.pergunta.length > 50 
          ? config.pergunta.substring(0, 50) + '...' 
          : config.pergunta;
        
        const newChat: Chat = {
          id: chatId,
          title,
          messages: [],
          selectedAgents: config.selectedAgents,
          numRodadas: config.numRodadas,
          createdAt: new Date(),
          folderId: null
        };
        
        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: chatId
        }));
        
        return chatId;
      },
      
      addMessage: (chatId, message) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, messages: [...chat.messages, message] }
              : chat
          )
        }));
      },
      
      setCurrentChat: (chatId) => set({ currentChatId: chatId }),
      
      deleteChat: (chatId) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          currentChatId: state.currentChatId === chatId ? null : state.currentChatId
        }));
      },
      
      setIsDebating: (debating) => set({ isDebating: debating }),
      
      getCurrentChat: () => {
        const state = get();
        if (!state.currentChatId) return null;
        return state.chats.find((chat) => chat.id === state.currentChatId) || null;
      },
      
      updateChatDebateId: (chatId, debateId) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, debateId } : chat
          )
        }));
      },
      
      updateChat: (chatId, updates) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, ...updates } : chat
          )
        }));
      },
      
      // Folder actions
      setFolders: (folders) => set({ folders }),
      addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
      updateFolder: (folderId, updates) => set((state) => ({
        folders: state.folders.map((f) => f.id === folderId ? { ...f, ...updates } : f)
      })),
      deleteFolder: (folderId) => set((state) => ({
        folders: state.folders.filter((f) => f.id !== folderId),
        chats: state.chats.map((chat) => 
          chat.folderId === folderId ? { ...chat, folderId: null } : chat
        )
      })),
      setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),
      moveChatToFolder: (chatId, folderId) => set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId ? { ...chat, folderId } : chat
        )
      }))
    }),
    {
      name: 'debate-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chats: state.chats,
        folders: state.folders,
        currentChatId: state.currentChatId,
        selectedFolderId: state.selectedFolderId,
        selectedAgents: state.selectedAgents,
        numRodadas: state.numRodadas
      })
    }
  )
);

