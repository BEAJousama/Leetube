import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AuthAPI,
  type User,
  type LoginRequest,
  type RegisterRequest,
} from "@/api/AuthApi";
import { setAccessToken } from "@/api/Client";
import {
  initializeTokenManagement,
  cleanupTokenManagement,
} from "@/utils/TokenManager";
import { UsersAPI } from "@/api/UsersApi";

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  storedRefreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verificationMessage: {
    type: "success" | "error" | "already-verified" | null;
    message: string;
  } | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  handleOAuthCallback: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setAuthData: (user: User, token: string, storedRefreshToken?: string) => void;
  setVerificationMessage: (
    type: "success" | "error" | "already-verified" | null,
    message?: string,
  ) => void;
  clearVerificationMessage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      storedRefreshToken: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      verificationMessage: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await AuthAPI.login(credentials);

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Initialize token management with automatic refresh
          initializeTokenManagement(response.token, (newToken) => {
            // Update store when token is refreshed automatically (persists to localStorage)
            set((state: any) => ({ ...state, token: newToken }));
          });
        } catch (error: any) {
          set({
            user: null,
            token: null,
            storedRefreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || "Login failed",
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await AuthAPI.register(data);

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Initialize token management with automatic refresh
          initializeTokenManagement(response.token, (newToken) => {
            // Update store when token is refreshed automatically (persists to localStorage)
            set((state: any) => ({ ...state, token: newToken }));
          });
        } catch (error: any) {
          set({
            user: null,
            token: null,
            storedRefreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || "Registration failed",
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await AuthAPI.logout();
        } catch (_error) {
          // console.error("Logout error:", error);
        } finally {
          // Clean up token management
          cleanupTokenManagement();

          set({
            user: null,
            token: null,
            storedRefreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      refreshUser: async () => {
        try {
          const { token } = get();
          if (!token) return;

          set({ isLoading: true });
          setAccessToken(token);

          const user = await UsersAPI.getMe();

          // Handle nested user object from API response

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (_error: any) {
          // console.error("Failed to refresh user:", error);
          set({
            user: null,
            token: null,
            storedRefreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: "Session expired",
          });
          setAccessToken(null);
        }
      },

      refreshToken: async () => {
        try {
          set({ isLoading: true, error: null });
          const currentRefreshToken = get().storedRefreshToken;

          const response = await AuthAPI.refreshToken(currentRefreshToken || undefined);

          // Update the token in the store
          set((state: AuthState) => ({
            ...state,
            token: response.accessToken,
            ...(response.refreshToken && { storedRefreshToken: response.refreshToken }),
            isLoading: false,
            error: null,
            // Update user if provided in refresh response
            ...(response.user && { user: response.user as User }),
          }));

          // Set token for API client
          setAccessToken(response.accessToken);
        } catch (error: any) {
          // console.error("Failed to refresh token:", error);

          // Clear authentication state on refresh failure
          set({
            user: null,
            token: null,
            storedRefreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || "Token refresh failed",
          });

          setAccessToken(null);
          throw error;
        }
      },

      handleOAuthCallback: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await AuthAPI.handleOAuthCallback();

          if (response) {
            set({
              user: response.user,
              token: response.token || null,
              storedRefreshToken: response.refreshToken || null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            if (response.token) {
              setAccessToken(response.token);
            }
          } else {
            throw new Error("OAuth authentication failed");
          }
        } catch (error: any) {
          set({
            user: null,
            token: null,
            storedRefreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || "OAuth authentication failed",
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setAuthData: (user: User, token: string, storedRefreshToken?: string) => {
        // Set token for API client
        setAccessToken(token);

        // Update store state
        set({
          user,
          token,
          ...(storedRefreshToken && { storedRefreshToken }),
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Initialize token management
        initializeTokenManagement(token, (newToken) => {
          set((state: any) => ({ ...state, token: newToken }));
        });
      },

      setVerificationMessage: (
        type: "success" | "error" | "already-verified" | null,
        message?: string,
      ) => {
        set({
          verificationMessage: type
            ? {
                type,
                message: message || "",
              }
            : null,
        });
      },

      clearVerificationMessage: () => {
        set({ verificationMessage: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        storedRefreshToken: state.storedRefreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // Rehydration
      onRehydrateStorage: () => (state: any) => {
        // Fix nested user object issue if it exists
        if (state?.user?.user) {
          state.user = state.user.user;
        }

        if (state?.token) {
          // Initialize token management on app restart
          initializeTokenManagement(state.token, (newToken) => {
            // Update store when token is refreshed automatically (persists to localStorage)
            useAuthStore.setState((currentState: any) => ({
              ...currentState,
              token: newToken,
            }));
          });
        }
      },
    },
  ),
);

// Hook for common auth operations
export const useAuth = () => {
  const store = useAuthStore();

  return {
    ...store,
    isLoggedIn: store.isAuthenticated && !!store.user,
  };
};

// Direct store access for OAuth callback
export const setAuthData = (token: string, user: User, storedRefreshToken?: string) => {
  useAuthStore.setState({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture,
      emailVerified: user.emailVerified,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token: token,
    ...(storedRefreshToken && { storedRefreshToken }),
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
};
