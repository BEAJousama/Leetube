import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UsersAPI } from "../api/UsersApi";
import type { EditUserRequest } from "@/api/UsersApi";
import { useAuthStore } from "@/stores/AuthStore";

// Query Keys for users
export const usersKeys = {
  all: ["users"] as const,
  list: () => [...usersKeys.all, "list"] as const,
  details: (userId: string) => [...usersKeys.all, "details", userId] as const,
} as const;

// Queries
export const useUsers = () => {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: UsersAPI.fetchUsers,
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

export const useUserDetails = (userId: string) => {
  return useQuery({
    queryKey: usersKeys.details(userId),
    queryFn: () => UsersAPI.fetchUserDetails(userId),
    enabled: !!userId, // Only run this query if userId is provided
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

// Mutations
export const useEditUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: EditUserRequest) => UsersAPI.editUser(user),
    onSuccess: (data) => {
      // Invalidate user list and details queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });
      queryClient.invalidateQueries({
        queryKey: usersKeys.details(data.id),
      });
      const currentState = useAuthStore.getState();
      currentState.refreshUser();
    },
    onError: (_error) => {
      // console.error("Edit user failed:", error); // Already commented for lint compliance
    },
  });
};

export const useUpdatePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: { currentPassword: string; newPassword: string }) =>
      UsersAPI.updatePassword(request),
    onSuccess: (_data) => {
      // Invalidate auth profile query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
      const currentState = useAuthStore.getState();
      currentState.refreshUser();
    },

    onError: (_error) => {
      // console.error("Update password failed:", error); // Already commented for lint compliance
    },
  });
};

export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { file: File; userId: string }) =>
      UsersAPI.uploadProfilePicture(data.file, data.userId),
    onSuccess: (data, variables) => {
      // Invalidate user details and auth profile queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: usersKeys.details(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
      const currentState = useAuthStore.getState();
      currentState.refreshUser();
    },
    onError: (_error) => {
      // console.error("Upload profile picture failed:", error); // Already commented for lint compliance
    },
  });
};
