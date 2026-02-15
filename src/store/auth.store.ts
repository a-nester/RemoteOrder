import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";

export type Role = "admin" | "manager" | "client";

export type User = {
  id: number;
  email: string;
  role: Role;
  warehouseId?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isHydrated: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,

      login: async (email, password) => {
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          if (!response.ok) return false;

          const data = await response.json();
          set({
            user: data.user,
            token: data.token
          });
          return true;
        } catch (error) {
          console.error("Login failed", error);
          return false;
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
