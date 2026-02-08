import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Role = "admin" | "manager" | "client";

export type User = {
  id: number;
  email: string;
  role: Role;
  warehouseId?: string; // Optional for admin, required for manager/client in logic
};

type AuthState = {
  user: User | null;
  isHydrated: boolean;

  login: (email: string, password: string) => boolean;
  logout: () => void;
  setHydrated: () => void;
};

// мок-дані (тимчасово)
const USERS = [
  { id: 1, email: "admin@test.com", password: "123456", role: "admin" },
  {
    id: 2,
    email: "manager@test.com",
    password: "123456",
    role: "manager",
    warehouseId: "1", // Main Warehouse
  },
  {
    id: 3,
    email: "client@test.com",
    password: "123456",
    role: "client",
    warehouseId: "1", // Main Warehouse
  },
  {
    id: 4,
    email: "manager2@test.com",
    password: "123456",
    role: "manager",
    warehouseId: "2", // Kyiv Branch
  },
  {
    id: 5,
    email: "client2@test.com",
    password: "123456",
    role: "client",
    warehouseId: "2", // Kyiv Branch
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,

      login: (email, password) => {
        const found = USERS.find(
          (u) => u.email === email && u.password === password
        );

        if (!found) return false;

        set({
          user: {
            id: found.id,
            email: found.email,
            role: found.role as Role,
            warehouseId: found.warehouseId,
          },
        });

        return true;
      },

      logout: () => {
        set({ user: null });
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),

      // ⬇️ КЛЮЧОВЕ: зберігаємо ТІЛЬКИ user
      partialize: (state) => ({
        user: state.user,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
