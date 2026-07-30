import { AuthAPI } from "@/api/AuthApi";
import { setAccessToken } from "@/api/Client";

/**
 * Token Manager Utility
 * Handles automatic token refresh, validation, and lifecycle management
 */

export interface TokenInfo {
  token: string;
  expiresAt?: number;
  refreshAt?: number;
}

class TokenManager {
  private refreshTimer: number | null = null;
  private isRefreshing = false;

  /**
   * Parse JWT token to extract expiration info
   */
  private parseJWT(token: string): { exp?: number; iat?: number } {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (_error) {
      // console.error("Failed to parse JWT token:", error);
      return {};
    }
  }

  /**
   * Check if token is expired or will expire soon
   */
  isTokenExpired(token: string, bufferTime: number = 60000): boolean {
    const payload = this.parseJWT(token);
    if (!payload.exp) return false;

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();

    return now >= expirationTime - bufferTime;
  }

  /**
   * Get time until token expires
   */
  getTimeUntilExpiry(token: string): number {
    const payload = this.parseJWT(token);
    if (!payload.exp) return 0;

    const expirationTime = payload.exp * 1000;
    const now = Date.now();

    return Math.max(0, expirationTime - now);
  }

  /**
   * Schedule automatic token refresh
   */
  scheduleTokenRefresh(
    token: string,
    onRefresh?: (newToken: string) => void,
  ): void {
    this.clearRefreshTimer();

    const payload = this.parseJWT(token);
    if (!payload.exp) return;

    const expirationTime = payload.exp * 1000;
    const now = Date.now();

    // Refresh token 5 minutes before expiration
    const refreshTime = expirationTime - now - 5 * 60 * 1000;

    if (refreshTime > 0) {
      this.refreshTimer = window.setTimeout(async () => {
        try {
          await this.refreshTokenSilently();
          if (onRefresh) {
            const newToken = this.getCurrentToken();
            if (newToken) onRefresh(newToken);
          }
        } catch (_error) {}
      }, refreshTime);
    }
  }

  /**
   * Clear refresh timer
   */
  clearRefreshTimer(): void {
    if (this.refreshTimer) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Get current token from storage
   */
  private getCurrentToken(): string | null {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.token || null;
      }
    } catch (_error) {
      // console.error("Failed to get current token:", error);
    }
    return null;
  }

  /**
   * Silently refresh token without user interaction
   */
  async refreshTokenSilently(): Promise<string | null> {
    if (this.isRefreshing) {
      return null;
    }

    this.isRefreshing = true;

    try {
      const response = await AuthAPI.refreshToken();
      const newToken = response.accessToken;

      try {
        const { useAuthStore } = await import("../stores/AuthStore");
        useAuthStore.setState((state: any) => ({
          ...state,
          token: newToken,
        }));
      } catch (_error) {}

      // Schedule next refresh
      this.scheduleTokenRefresh(newToken);

      return newToken;
    } catch (_error: any) {
      // console.error("Silent token refresh failed:", error);

      // Clear any scheduled refreshes on failure
      this.clearRefreshTimer();
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Initialize token management for a given token
   */
  initializeToken(token: string, onRefresh?: (newToken: string) => void): void {
    // Set the token for immediate use
    setAccessToken(token);

    // Schedule automatic refresh
    this.scheduleTokenRefresh(token, onRefresh);
  }

  /**
   * Clean up token management
   */
  cleanup(): void {
    this.clearRefreshTimer();
    this.isRefreshing = false;
    setAccessToken(null);
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== "string") return false;

    const parts = token.split(".");
    return parts.length === 3; // JWT format: header.payload.signature
  }

  /**
   * Get token info
   */
  getTokenInfo(token: string): TokenInfo | null {
    if (!this.isValidTokenFormat(token)) return null;

    const payload = this.parseJWT(token);

    return {
      token,
      expiresAt: payload.exp ? payload.exp * 1000 : undefined,
      refreshAt: payload.exp ? payload.exp * 1000 - 5 * 60 * 1000 : undefined,
    };
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Utility functions for easier access
export const initializeTokenManagement = (
  token: string,
  onRefresh?: (newToken: string) => void,
) => {
  tokenManager.initializeToken(token, onRefresh);
};

export const cleanupTokenManagement = () => {
  tokenManager.cleanup();
};

export const refreshTokenSilently = () => {
  return tokenManager.refreshTokenSilently();
};

export const isTokenExpired = (token: string, bufferTime?: number) => {
  return tokenManager.isTokenExpired(token, bufferTime);
};

export const getTokenInfo = (token: string) => {
  return tokenManager.getTokenInfo(token);
};
