export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  picture?: string;
  email: string;
  preferredLanguage?: "en" | "fr" | "es" | "de";
  role?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  picture?: string;
  bio?: string;
  preferredLanguage?: "en" | "fr" | "es" | "de";
}
