import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, ChatRoom, SiteSettings } from './types';

interface AppState {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  activeRoom: ChatRoom | null;
  setActiveRoom: (room: ChatRoom | null) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isAuthLoading: boolean;
  setAuthLoading: (loading: boolean) => void;
  siteSettings: SiteSettings | null;
  setSiteSettings: (settings: SiteSettings | null) => void;
  unreadMessages: string[]; 
  setUnreadMessage: (userId: string, remove?: boolean) => void;
  joinedRooms: ChatRoom[];
  joinRoom: (room: ChatRoom) => void;
  leaveRoom: (roomId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      activeRoom: null,
      setActiveRoom: (room) => set({ activeRoom: room }),
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      isAuthLoading: true,
      setAuthLoading: (loading) => set({ isAuthLoading: loading }),
      siteSettings: null,
      setSiteSettings: (siteSettings) => set({ siteSettings }),
      unreadMessages: [],
      setUnreadMessage: (userId, remove) => set((state) => ({
         unreadMessages: remove 
           ? state.unreadMessages.filter(id => id !== userId)
           : state.unreadMessages.includes(userId) ? state.unreadMessages : [...state.unreadMessages, userId]
      })),
      joinedRooms: [],
      joinRoom: (room) => set((state) => {
        if (state.joinedRooms.find(r => r.id === room.id)) return state;
        return { joinedRooms: [...state.joinedRooms, room], activeRoom: room };
      }),
      leaveRoom: (roomId) => set((state) => {
        const newRooms = state.joinedRooms.filter(r => r.id !== roomId);
        return { 
          joinedRooms: newRooms, 
          activeRoom: state.activeRoom?.id === roomId ? (newRooms[0] || null) : state.activeRoom 
        };
      })
    }),
    {
      name: 'chat-app-storage',
      partialize: (state) => ({ currentUser: state.currentUser, theme: state.theme, activeRoom: state.activeRoom, joinedRooms: state.joinedRooms }),
    }
  )
);
