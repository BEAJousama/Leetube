import { client } from "./Client";
import type { User } from "@/types/Users";

// Types for User API requests and responses
export interface UserListResponse {
  users: User[];
}

export interface UserDetailsResponse extends User {}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface EditUserRequest {
  userId: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  preferredLanguage?: "en" | "fr" | "es" | "de";
}

// User API class
export class UsersAPI {
  // Fetch a list of users
  static async fetchUsers(): Promise<UserListResponse> {
    const response = await client.get("/api/users");
    return response.data;
  }

  // Fetch details of a specific user by ID
  static async fetchUserDetails(userId: string): Promise<UserDetailsResponse> {
    const response = await client.get(`/api/users/${userId}`);
    return response.data;
  }

  static async getMe(): Promise<User> {
    const response = await client.get("/api/users/me");
    return response.data;
  }

  // Update user password
  static async updatePassword(
    request: UpdatePasswordRequest,
  ): Promise<{ message: string }> {
    const response = await client.put(`/api/users/change-password`, request);
    return response.data;
  }

  // Edit user profile
  static async editUser(request: EditUserRequest): Promise<User> {
    const { userId, ...data } = request;
    const response = await client.put(`/api/users/${userId}`, data);
    return response.data;
  }

  static async uploadProfilePicture(
    file: File,
    userId: string,
  ): Promise<{ pictureUrl: string }> {
    const formData = new FormData();
    formData.append("picture", file);
    const response = await client.post(
      `/api/users/${userId}/picture`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  // Remove user profile picture
  static async removeProfilePicture(
    userId: string,
  ): Promise<{ message: string }> {
    const response = await client.delete(`/api/users/${userId}/remove-picture`);
    return response.data;
  }

  static async fetchUserByUsername(username: string): Promise<User> {
    const response = await client.get(`/api/users/username/${username}`);
    return response.data;
  }
}
