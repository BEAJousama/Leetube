import { client } from "./Client";
import type { Movie } from "@/types/Movie";

// Types for Movie API requests and responses

export interface MovieListResponse {
  movies: Movie[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MovieDetailsResponse extends Movie {}

// Movie API class
export class MoviesAPI {
  // Fetch a list of movies with optional pagination and filtering
  static async fetchMovies(
    page: number = 1,
    pageSize: number = 20,
    sortBy?: string,
  ): Promise<MovieListResponse> {
    const params: any = { page, limit: pageSize }; // Use 'limit' instead of 'pageSize'
    if (sortBy) params.sortBy = sortBy;

    const response = await client.get("/api/movies", { params });
    return response.data.movies;
  }

  // Search for movies by title, year, or cast
  static async searchMovies(
    searchType: "title" | "year" | "cast",
    query: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<MovieListResponse> {
    const params: any = { page, limit: pageSize }; // Use 'limit' instead of 'pageSize'

    // Add the appropriate search parameter based on type
    switch (searchType) {
      case "title":
        params.title = query;
        break;
      case "year":
        params.year = query;
        break;
      case "cast":
        params.cast = query;
        break;
    }

    const response = await client.get("/api/movies/search", { params });
    return response.data;
  }
  // Fetch movies by category (genre)
  static async fetchMoviesByCategory(
    category: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy?: string,
  ): Promise<MovieListResponse> {
    const params = { genre: category, page, limit: pageSize, sortBy }; // Use 'limit' instead of 'pageSize'
    const response = await client.get(`/api/movies`, { params });
    return response.data;
  }

  static async fetchLibraryMovies(): Promise<Movie[]> {
    const response = await client.get("/api/movies/my-library");
    return response.data.movies;
  }

  static async fetchFavoriteMovies(): Promise<Movie[]> {
    const response = await client.get("/api/movies/my-favorites");
    return response.data.movies;
  }

  static async fetchTrendingMovies(): Promise<Movie[]> {
    const response = await client.get("/api/movies/trending");

    return response.data.movies;
  }

  static async fetchPopularMovies(): Promise<Movie[]> {
    const response = await client.get("/api/movies/popular");
    return response.data.movies;
  }

  static async fetchMovieById(movieId: string): Promise<MovieDetailsResponse> {
    const response = await client.get(`/api/movies/${movieId}`);
    return response.data;
  }

  // Announce a movie torrent (start or register stream processing)
  static async announceMovie(params: {
    movieId: number | string;
    userId?: string;
    magnet: string;
  }): Promise<{
    message: string;
    metadata: { fileSize: number; clipIndex: number; extension: string };
  }> {
    const response = await client.post(`/api/torrent/downloadMovie`, params);
    return response.data;
  }

  // Check if video is ready for streaming
  static async checkVideoReadiness(
    movieId: string | number,
  ): Promise<{ isReady: boolean; progress?: number; error?: string }> {
    const response = await client.get(
      `/api/torrent/video-readiness?movieId=${movieId}`,
    );
    return response.data;
  }

  static async toggleFavorite(
    movieId: string,
    inFavorite: boolean,
  ): Promise<{ movie: Movie | null }> {
    const response = await client[inFavorite ? "delete" : "post"](
      `/api/movies/${movieId}/${inFavorite ? "remove-from-favorites" : "add-to-favorites"}`,
    );
    return response.data;
  }

  static async toggleLibrary(
    movieId: string,
    inLibrary: boolean,
  ): Promise<{ movie: Movie | null }> {
    const response = await client[inLibrary ? "delete" : "post"](
      `/api/movies/${movieId}/${inLibrary ? "remove-from-library" : "add-to-library"}`,
    );
    return response.data;
  }

  static async rateMovie(
    movieId: string,
    rating: number,
  ): Promise<{ rating: any | null }> {
    const response = await client.post(`/api/movies/${movieId}/rate`, {
      rating,
    });
    return response.data;
  }

  static async fetchLocalRatings(movieId: string): Promise<any> {
    const response = await client.get(`/api/movies/${movieId}/ratings`);
    return response.data.ratings;
  }

  static async clearLocalRating(movieId: string): Promise<void> {
    await client.post(`/api/movies/${movieId}/clear-rating`);
  }
  static async stopMovieDownload(movieId: string): Promise<void> {
    await client.get(`/api/torrent/stop-download`, { params: { movieId } });
  }
}
