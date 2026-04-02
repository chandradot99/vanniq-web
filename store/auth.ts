import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserResponse } from "@/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  orgId: string | null;
  role: string | null;
  setTokens: (access: string, refresh: string, orgId: string, role: string) => void;
  setUser: (user: UserResponse) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      orgId: null,
      role: null,

      setTokens: (access, refresh, orgId, role) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", access);
        }
        set({ accessToken: access, refreshToken: refresh, orgId, role });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
        }
        set({ accessToken: null, refreshToken: null, user: null, orgId: null, role: null });
      },

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: "vaaniq-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        orgId: state.orgId,
        role: state.role,
      }),
    }
  )
);
