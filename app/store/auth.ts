// store/auth.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/hooks/api/useAuth";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

export interface GetUserResponse {
  user: User;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  _hasHydrated: boolean;
  setUser: (user: User) => void;
  clearAuth: () => void;
  verifySession: () => Promise<void>;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false, // Changed to false - only true during verification
      error: null,
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setUser: (user) =>
        set({ user, isAuthenticated: true, isLoading: false, error: null }),
      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }),
      verifySession: async () => {
        // Only set loading true if user is not already authenticated from persisted state
        if (!get().isAuthenticated) {
          set({ isLoading: true });
        }
        try {
          const response = await apiClient.get<GetUserResponse>(
            API_ENDPOINTS.GET_USER,
          );
          console.log(response);
          if (response.data?.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false, // Always set to false on completion
              error: null,
            });
          } else {
            throw new Error("Invalid user data received");
          }
        } catch (error) {
          console.log("Session verification failed, user is not logged in.");
          // On any error, log the user out.
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false, // Always set to false on completion
            error: error as Error,
          });
        }
      },
    }),
    {
      name: "auth-storage", // Name for localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }), // Only persist user and isAuthenticated
      onRehydrateStorage: () => {
        return (state, error) => {
          if (state) {
            state.setHasHydrated(true);
          }
        };
      },
    },
  ),
);
