import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, TokenPair } from '@/types/auth.types';
import { TokenManager } from '@/utils/tokenManager';

interface AuthState {
  user: User | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: TokenPair) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  updateTokens: (tokens: TokenPair) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set): AuthState => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      setAuth: (user: User, tokens: TokenPair) => {
        TokenManager.setTokens(tokens);
        set({
          user,
          tokens,
          isAuthenticated: true,
        });
      },
      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      logout: () => {
        TokenManager.clearTokens();
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        });
      },
      updateTokens: (tokens: TokenPair) => {
        TokenManager.setTokens(tokens);
        set({ tokens });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
