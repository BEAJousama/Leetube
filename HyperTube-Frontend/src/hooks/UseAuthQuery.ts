import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthAPI } from "../api/AuthApi";
import type {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../api/AuthApi";
import { UsersAPI } from "@/api/UsersApi";

// Query Keys for auth
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  devices: () => [...authKeys.all, "devices"] as const,
} as const;

// Queries
export const useProfile = () => {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: UsersAPI.getMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if it's an authentication error
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useDevices = () => {
  return useQuery({
    queryKey: authKeys.devices(),
    queryFn: AuthAPI.getDevices,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutations

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => AuthAPI.login(credentials),
    onSuccess: (data) => {
      // Set user data in cache after successful login
      if (data.user) {
        queryClient.setQueryData(authKeys.profile(), data.user);
      }
      // Invalidate all auth queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (_error) => {
      // console.error("Login failed:", error); // Already commented for lint compliance
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => AuthAPI.register(userData),
    onSuccess: (data) => {
      // Set user data in cache after successful registration
      if (data.user) {
        queryClient.setQueryData(authKeys.profile(), data.user);
      }
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (_error) => {
      // console.error("Registration failed:", error); // Already commented for lint compliance
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthAPI.logout,
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
    onError: (_error) => {
      // console.error("Logout failed:", error); // Already commented for lint compliance
      // Even if logout fails, clear local cache
      queryClient.clear();
    },
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthAPI.refreshToken,
    onSuccess: () => {
      // Invalidate all queries to refetch with new token
      queryClient.invalidateQueries();
    },
    onError: (_error) => {
      // console.error("Token refresh failed:", error); // Already commented for lint compliance
      // On refresh failure, clear auth data
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => AuthAPI.forgotPassword(data),
    onError: (_error) => {
      // console.error("Forgot password failed:", error); // Already commented for lint compliance
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({
      token,
      data,
    }: {
      token: string;
      data: ResetPasswordRequest;
    }) => AuthAPI.resetPassword(token, data),
    onError: (_error) => {
      // console.error("Password reset failed:", error); // Already commented for lint compliance
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => AuthAPI.changePassword(data),
    onError: (_error) => {
      // console.error("Password change failed:", error); // Already commented for lint compliance
    },
  });
};

export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => AuthAPI.verifyEmail(token),
    onSuccess: () => {
      // Refetch profile to get updated email verification status
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
    onError: (_error) => {
      // console.error("Email verification failed:", error); // Already commented for lint compliance
    },
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      AuthAPI.resendVerification(data.email),
    onError: (_error) => {
      // console.error("Resend verification failed:", error); // Already commented for lint compliance
    },
  });
};

// Device management
export const useRevokeDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tokenId: string) => AuthAPI.revokeDevice(tokenId),
    onSuccess: () => {
      // Refetch devices list
      queryClient.invalidateQueries({ queryKey: authKeys.devices() });
    },
    onError: (_error) => {
      // console.error("Device revocation failed:", error); // Already commented for lint compliance
    },
  });
};

// revoke all devices except current
export const useRevokeAllDevices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => AuthAPI.revokeAllDevices(),
    onSuccess: () => {
      // Refetch devices list
      queryClient.invalidateQueries({ queryKey: authKeys.devices() });
    },
    onError: (_error) => {
      // console.error("Revoke all devices failed:", error); // Already commented for lint compliance
    },
  });
};

// OAuth mutations - simplified for available methods
export const useOAuthLogin = () => {
  return useMutation({
    mutationFn: ({
      provider,
    }: {
      provider: "42" | "google";
      redirectUri?: string;
    }) => {
      if (provider === "google") {
        // eslint-disable-next-line react-compiler/react-compiler
        window.location.href = AuthAPI.getGoogleOAuthUrl();
      } else if (provider === "42") {
        window.location.href = AuthAPI.get42OAuthUrl();
      }
      return Promise.resolve();
    },
    onError: (_error) => {
      // console.error("OAuth login failed:", error); // Already commented for lint compliance
    },
  });
};

export const useOAuthCallback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AuthAPI.handleOAuthCallback(),
    onSuccess: (data) => {
      // Set user data after successful OAuth login
      if (data?.user) {
        queryClient.setQueryData(authKeys.profile(), data.user);
      }
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (_error) => {
      // console.error("OAuth callback failed:", error);
    },
  });
};
