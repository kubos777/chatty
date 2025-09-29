import { create } from 'zustand'
import type {Message} from '../types/chat'

interface ChatState {
    // State
    messages: Message[]
    currentRoom: string
    username: string
    onlineUsers: string[]
    typingUsers: string[]
    isJoined: boolean

    // Actions
    setMessages: (messages: Message[]) => void
    addMessage: (message: Message) => void
    setCurrentRoom: (roomId: string) => void
    setUsername: (username: string) => void
    setOnlineUsers: (users: string[]) => void
    setTypingUsers: (users: string[]) => void
    setIsJoined: (joined: boolean) => void
    clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
    // Initial state
    messages: [],
    currentRoom: 'general',
    username: '',
    onlineUsers: [],
    typingUsers: [],
    isJoined: false,

    // Actions
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),
    setCurrentRoom: (roomId) => set({ currentRoom: roomId }),
    setUsername: (username) => set({ username }),
    setOnlineUsers: (users) => set({ onlineUsers: users }),
    setTypingUsers: (users) => set({ typingUsers: users }),
    setIsJoined: (joined) => set({ isJoined: joined }),
    clearMessages: () => set({ messages: [] }),
}))