import axios from "axios";
import { API_BASE_URL, REFRESH_TOKEN_URL } from "../../Env";

export const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for handling cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

client.interceptors.request.use((config) => {
  // Add access token to requests if available
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Track refresh requests to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

client.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If there is no access token currently set, don't attempt to refresh.
      // This prevents triggering a refresh when a login attempt fails (wrong password).
      if (!accessToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await axios.post(
          REFRESH_TOKEN_URL,
          {},
          {
            withCredentials: true,
            timeout: 10000, // 10 second timeout for refresh requests
          },
        );

        const responseData = response.data;
        const newToken = responseData.accessToken || responseData.token;

        if (!newToken) {
          throw new Error("No access token received from refresh endpoint");
        }

        setAccessToken(newToken);

        // Update the auth store with the new token (this will persist to localStorage)
        const { useAuthStore } = await import("../stores/AuthStore");
        useAuthStore.setState((state) => ({
          ...state,
          token: newToken,
        }));

        // Process queued requests
        processQueue(null, newToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError: any) {
        // Process queued requests with error
        processQueue(refreshError, null);

        // Clear token and redirect to login
        setAccessToken(null);

        // Update auth store to clear authentication state
        const { useAuthStore } = await import("../stores/AuthStore");
        await useAuthStore.getState().logout();

        // console.error("Token refresh failed:", refreshError); // Removed for lint compliance

        // Only redirect if we're not already on an auth page
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes("/auth/") &&
          !currentPath.includes("/login") &&
          !currentPath.includes("/register")
        ) {
          window.location.href = "/auth/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
