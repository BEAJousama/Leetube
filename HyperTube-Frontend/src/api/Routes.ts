export const AppRoutes: Record<string, string> = {
  HOME: "/home",
  SEARCH: "/search",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  OAUTH_CALLBACK: "/auth/callback",
  OAUTH_SUCCESS: "/auth/success",
  ABOUT: "/about",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  FAVORITES: "/favorites",
  TRENDING: "/trending",
  LIBRARY: "/library",
  MOVIE: "/movie/:id",
};

export const ApiRoutes: Record<string, string> = {
  getUser: "/user",
  updateUser: "/user/update",
  deleteUser: "/user/delete",
  getPosts: "/posts",
  createPost: "/posts/create",
  updatePost: "/posts/update",
  deletePost: "/posts/delete",
};
