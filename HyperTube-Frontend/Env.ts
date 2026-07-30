import { z } from "zod";

export const EnvSchema = z.object({
  // Vite/Development
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // API Configuration
  VITE_API_BASE_URL: z.string().url().default("http://localhost:3000"),
  VITE_APP_URL: z.string().url().default("http://localhost:3001"),

  // OAuth URLs (will be constructed from API_BASE_URL if not provided)
  VITE_GOOGLE_OAUTH_URL: z.string().url().optional(),
  VITE_FORTYTWO_OAUTH_URL: z.string().url().optional(),

  // App Configuration
  VITE_APP_NAME: z.string().default("HyperTube"),
  VITE_APP_VERSION: z.string().default("1.0.0"),

  // Development settings
  VITE_HOST: z.string().default("localhost"),
  VITE_PORT: z.string().default("5173"),

  // Optional: Additional API endpoints
  VITE_REFRESH_TOKEN_URL: z.string().url().optional(),
});

// Parse and validate environment variables
const envVars = {
  NODE_ENV: import.meta.env.MODE || "development",
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_APP_URL: import.meta.env.VITE_APP_URL,
  VITE_GOOGLE_OAUTH_URL: import.meta.env.VITE_GOOGLE_OAUTH_URL,
  VITE_FORTYTWO_OAUTH_URL: import.meta.env.VITE_FORTYTWO_OAUTH_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  VITE_HOST: import.meta.env.VITE_HOST,
  VITE_PORT: import.meta.env.VITE_PORT,
  VITE_REFRESH_TOKEN_URL: import.meta.env.VITE_REFRESH_TOKEN_URL,
};

export const env = EnvSchema.parse(envVars);

// Export commonly used URLs
export const API_BASE_URL = env.VITE_API_BASE_URL;
export const APP_URL = env.VITE_APP_URL;
export const GOOGLE_OAUTH_URL =
  env.VITE_GOOGLE_OAUTH_URL || `${API_BASE_URL}/api/auth/google`;
export const FORTYTWO_OAUTH_URL =
  env.VITE_FORTYTWO_OAUTH_URL || `${API_BASE_URL}/api/auth/42`;
export const REFRESH_TOKEN_URL =
  env.VITE_REFRESH_TOKEN_URL || `${API_BASE_URL}/api/auth/refresh`;
