import { client, setAccessToken } from "./Client";
import { GOOGLE_OAUTH_URL, FORTYTWO_OAUTH_URL } from "../../Env";
import { UsersAPI } from "./UsersApi";

// Types for API requests and responses
export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  role?: string;
  preferredLanguage?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendAuthResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string | null;
    role: string;
    preferredLanguage: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}

// Authentication API service
export class AuthAPI {
  // Register new user
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await client.post("/api/auth/register", data);
    const backendResponse: BackendAuthResponse = response.data;

    if (!backendResponse.accessToken) {
      throw new Error(
        backendResponse.message ||
          "Registration failed - no access token received",
      );
    }

    const { user, accessToken } = backendResponse;

    // Set token for future requests
    setAccessToken(accessToken);

    // Transform backend user to our User interface
    const transformedUser: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture || undefined,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Transform to our expected format
    const authData: AuthResponse = {
      token: accessToken,
      user: transformedUser,
    };

    return authData;
  }

  // Login user
  static async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await client.post("/api/auth/login", data);
    const backendResponse: BackendAuthResponse = response.data;

    if (!backendResponse.accessToken) {
      throw new Error(
        backendResponse.message || "Login failed - no access token received",
      );
    }

    const { user, accessToken } = backendResponse;

    // Set token for future requests
    setAccessToken(accessToken);

    // Transform backend user to our User interface
    const transformedUser: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture || undefined,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Transform to our expected format
    const authData: AuthResponse = {
      token: accessToken,
      user: transformedUser,
    };

    return authData;
  }

  // Logout user
  static async logout(): Promise<void> {
    await client.post("/api/auth/logout");
    setAccessToken(null);
  }

  // Refresh access token
  static async refreshToken(): Promise<{ accessToken: string; user?: User }> {
    try {
      const response = await client.post(
        "/api/auth/refresh",
        {},
        {
          withCredentials: true,
          timeout: 10000, // 10 second timeout
        },
      );

      const responseData = response.data;

      // Handle different possible response formats from backend
      const accessToken = responseData.accessToken || responseData.token;
      const user = responseData.user;

      if (!accessToken) {
        throw new Error("No access token received from refresh endpoint");
      }

      // Set the new token for future requests
      setAccessToken(accessToken);

      // Return standardized format
      return {
        accessToken,
        user: user
          ? {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              picture: user.picture || undefined,
              role: user.role,
              preferredLanguage: user.preferredLanguage,
              emailVerified: user.emailVerified || user.emailVerified, // Handle possible naming difference
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            }
          : undefined,
      };
    } catch (error: any) {
      // Clear any stored tokens
      setAccessToken(null);

      // Re-throw with more context
      if (error.response?.status === 401) {
        throw new Error("Refresh token expired or invalid");
      } else if (error.code === "ECONNABORTED") {
        throw new Error("Token refresh request timed out");
      } else {
        throw new Error(
          error.response?.data?.message || "Token refresh failed",
        );
      }
    }
  }

  // Verify email with token
  static async verifyEmail(token: string): Promise<void> {
    await client.get(`/api/auth/verify-email?token=${token}`);
  }

  // Resend verification email
  static async resendVerification(email: string): Promise<void> {
    await client.post("/api/auth/resend-verification", { email });
  }

  // Change password
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    await client.post("/api/auth/change-password", data);
  }

  // Initiate forgot password
  static async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await client.post("/api/auth/forgot-password", data);
  }

  // Reset password with token
  static async resetPassword(
    token: string,
    data: ResetPasswordRequest,
  ): Promise<void> {
    await client.post(`/api/auth/reset-password/${token}`, {
      newPassword: data.password,
    });
  }

  // OAuth methods
  static getGoogleOAuthUrl(): string {
    return GOOGLE_OAUTH_URL;
  }

  static get42OAuthUrl(): string {
    return FORTYTWO_OAUTH_URL;
  }

  // Handle OAuth callback (to be called after redirect)
  static async handleOAuthCallback(): Promise<AuthResponse | null> {
    try {
      // Fetch OAuth tokens set as HTTP-only cookies by the backend
      const response = await client.get("/api/auth/oauth-data", {
        withCredentials: true,
      });
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error("OAuth data not received");
      }
      
      return { token, user };
    } catch (_error) {
      // console.error("OAuth callback failed:", error); // Removed for lint compliance
      return null;
    }
  }

  // Get user devices
  static async getDevices(): Promise<any[]> {
    const response = await client.get("/api/auth/devices");
    return response.data.devices;
  }

  // Revoke device
  static async revokeDevice(deviceId: string): Promise<void> {
    await client.delete(`/api/auth/devices/${deviceId}`);
  }

  // Revoke all devices except current
  static async revokeAllDevices(): Promise<void> {
    await client.delete("/api/auth/devices/logout-all");
  }
  // Health check
  static async healthCheck(): Promise<{ status: string }> {
    const response = await client.get("/api/auth/health");
    return response.data;
  }
}
