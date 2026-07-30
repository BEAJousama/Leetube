import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { CommentAPI } from "../api/CommentApi";

import type {
  AddCommentRequest,
  CommentListResponse,
  EditCommentRequest,
} from "../api/CommentApi";

// Query Keys - centralized for cache management
export const commentKeys = {
  all: ["comments"] as const,
  lists: (movieId: string) => [...commentKeys.all, "list", movieId] as const,
  list: (movieId: string, page: number, pageSize: number) =>
    [...commentKeys.lists(movieId), { page, pageSize }] as const,
  details: () => [...commentKeys.all, "detail"] as const,
  detail: (id: string) => [...commentKeys.details(), id] as const,
} as const;

// Comments Queries
export const useComments = (movieId: string, page = 1, pageSize = 5) => {
  return useQuery({
    queryKey: commentKeys.list(movieId, page, pageSize),
    queryFn: async () => {
      const result = await CommentAPI.fetchComments(movieId, page, pageSize);
      // Return the full response instead of just comments
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: !!movieId, // Only run if movieId is provided
  });
};

// Infinite scroll for comments
export const useInfiniteComments = (movieId: string, pageSize = 5) => {
  return useInfiniteQuery({
    queryKey: commentKeys.lists(movieId),
    queryFn: ({ pageParam = 1 }) =>
      CommentAPI.fetchComments(movieId, pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage: CommentListResponse, allPages) => {
      const maxPages = Math.ceil(lastPage.total / pageSize);
      const nextPage = allPages.length + 1;
      return nextPage <= maxPages ? nextPage : undefined;
    },
    enabled: !!movieId, // Only run if movieId is provided
  });
};

// Comments Mutations
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newComment: AddCommentRequest) =>
      CommentAPI.addComment(newComment),
    onSuccess: (_data, variables) => {
      // Invalidate comments list for the specific movie to refetch
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(variables.movieId),
      });
    },
  });
};

export const useEditComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedComment: EditCommentRequest) =>
      CommentAPI.editComment(updatedComment),
    onSuccess: (data) => {
      // Invalidate the specific comment detail and the comments list for the movie
      queryClient.invalidateQueries({
        queryKey: commentKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(data.movieId),
      });
    },
  });
};

export const useDeleteComment = (movieId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => CommentAPI.deleteComment(commentId),
    onSuccess: () => {
      // Invalidate comments list for the specific movie to refetch
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(String(movieId)),
      });
    },
  });
};
