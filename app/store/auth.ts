import { create } from "zustand";
import type { User } from "@/hooks/api/useAuth";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

interface GetUserResponse {
  user: User;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // To track the initial session verification
  error: Error | null;
  setUser: (user: User) => void;
  clearAuth: () => void;
  verifySession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to indicate initial check is pending
  error: null,
  setUser: (user) =>
    set({ user, isAuthenticated: true, isLoading: false, error: null }),
  clearAuth: () =>
    set({ user: null, isAuthenticated: false, isLoading: false, error: null }),
  verifySession: async () => {
    if (!get().isLoading) {
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
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error("Invalid user data received");
      }
    } catch (error) {
      console.log("Session verification failed, user is not logged in.");
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error as Error,
      });
    }
  },
}));
