import { type User } from "@/api/AuthApi";

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  movieId: string;
  user: User;
}
