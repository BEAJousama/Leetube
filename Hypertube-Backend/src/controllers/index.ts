// Export all controllers
export { AuthController } from './auth.controller';
export { UserController } from './user.controller';
export { MovieController } from './movie.controller';
export { CommentController } from './comment.controller';

// Export controller interfaces and types
export type {
  LoginDto,
  ChangePasswordDto
} from './auth.controller';

export type {
  GetUsersQuery
} from './user.controller';

export type {
  GetCommentsQuery
} from './comment.controller';
