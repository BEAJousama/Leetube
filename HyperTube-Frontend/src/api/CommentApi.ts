import { client } from "./Client";
import type { Comment } from "@/types/Comment";

// Types for Comment API requests and responses
export interface CommentListResponse {
  comments: Comment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AddCommentRequest {
  movieId: string;
  content: string;
}

export interface EditCommentRequest {
  commentId: string;
  content: string;
}

// Comment API class
export class CommentAPI {
  // Fetch comments for a specific movie with pagination
  static async fetchComments(
    movieId: string,
    page: number = 1,
    pageSize: number = 5,
  ): Promise<CommentListResponse> {
    const params = { page, limit: pageSize }; // Use 'limit' instead of 'pageSize'
    const response = await client.get(`/api/movies/${movieId}/comments`, {
      params,
    });
    return response.data;
  }

  // Add a new comment to a movie
  static async addComment(request: AddCommentRequest): Promise<Comment> {
    const response = await client.post(
      `/api/movies/${request.movieId}/comments`,
      {
        content: request.content,
      },
    );
    return response.data;
  }

  // Edit an existing comment
  static async editComment(request: EditCommentRequest): Promise<Comment> {
    const response = await client.put(`/api/comments/${request.commentId}`, {
      content: request.content,
    });
    return response.data;
  }

  // Delete a comment
  static async deleteComment(commentId: string): Promise<{ message: string }> {
    const response = await client.delete(`/api/comments/${commentId}`);
    return response.data;
  }
}
