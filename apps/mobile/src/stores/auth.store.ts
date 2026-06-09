import { create } from 'zustand';
import type { IUsuario } from '@ruteai/shared-types';

interface AuthState {
  user: IUsuario | null;
  isLoading: boolean;
  login: (user: IUsuario) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
