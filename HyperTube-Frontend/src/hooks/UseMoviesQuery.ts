import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { MoviesAPI } from "../api/MoviesApi";

// Query Keys - centralized for cache management
export const movieKeys = {
  all: ["movies"] as const,
  lists: () => [...movieKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...movieKeys.lists(), filters] as const,
  details: () => [...movieKeys.all, "detail"] as const,
  detail: (id: string) => [...movieKeys.details(), id] as const,
  search: (type: string, query: string) =>
    [...movieKeys.all, "search", type, query] as const,
  category: (category: string) =>
    [...movieKeys.all, "category", category] as const,
  trending: () => [...movieKeys.all, "trending"] as const,
  library: () => [...movieKeys.all, "library"] as const,
  favorites: () => [...movieKeys.all, "favorites"] as const,
  videoReadiness: (movieId: string | number) =>
    [...movieKeys.all, "video-readiness", movieId] as const,
} as const;

// Movies Queries

// export const useMovies = (
//   page = 1,
//   pageSize = 20,
//   genre?: string,
// ) => {
//   return useQuery({
//     queryKey: movieKeys.list({ page, pageSize, genre }),
//     queryFn: async () => {
//       const result = await MoviesAPI.fetchMovies(
//         page,
//         pageSize,
//         genre,
//       );
//       // fetchMovies returns response.data.movies which is Movie[], but typed as MovieListResponse
//       return Array.isArray(result) ? result : result.movies || [];
//     },
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
//   });
// };

// Infinite scroll for movies
export const useInfiniteMovies = (pageSize = 20, sortBy?: string) => {
  return useInfiniteQuery({
    queryKey: movieKeys.list({ infinite: true, pageSize, sortBy }),
    queryFn: ({ pageParam = 1 }) =>
      MoviesAPI.fetchMovies(pageParam, pageSize, sortBy),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, allPages) => {
      // Assuming the API returns fewer movies when reaching the end
      if (lastPage && lastPage.length < pageSize) {
        return undefined; // No more pages
      }
      return allPages.length + 1;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Search movies
// export const useSearchMovies = (
//   searchType: 'title' | 'year' | 'cast',
//   query: string,
//   page = 1,
//   pageSize = 20
// ) => {
//   return useQuery({
//     queryKey: movieKeys.search(searchType, `${query}-${page}-${pageSize}`),
//     queryFn: () => MoviesAPI.searchMovies(searchType, query, page, pageSize),
//     enabled: !!query.trim(), // Only run when query is not empty
//     staleTime: 2 * 60 * 1000, // 2 minutes for search results
//   });
// };

// Infinite search
export const useInfiniteSearchMovies = (
  searchType: "title" | "year" | "cast",
  query: string,
  pageSize = 20,
) => {
  return useInfiniteQuery({
    queryKey: movieKeys.search(searchType, `infinite-${query}-${pageSize}`),
    queryFn: ({ pageParam = 1 }) =>
      MoviesAPI.searchMovies(searchType, query, pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, allPages) => {
      if (lastPage && lastPage.movies && lastPage.movies.length < pageSize) {
        return undefined;
      }
      return allPages.length + 1;
    },
    enabled: !!query.trim(),
    staleTime: 2 * 60 * 1000,
  });
};

// Movies by category
// export const useMoviesByCategory = (
//   category: string,
//   page = 1,
//   pageSize = 10,
// ) => {
//   return useQuery({
//     queryKey: movieKeys.category(`${category}-${page}-${pageSize}`),
//     queryFn: async () => {
//       const result = await MoviesAPI.fetchMoviesByCategory(
//         category,
//         page,
//         pageSize,
//       );
//       // fetchMoviesByCategory returns MovieListResponse
//       return Array.isArray(result) ? result : result.movies || [];
//     },
//     enabled: !!category,
//     staleTime: 5 * 60 * 1000,
//   });
// };

// Infinite movies by category
export const useInfiniteMoviesByCategory = (
  category: string,
  pageSize = 20,
  sortBy?: string,
) => {
  return useInfiniteQuery({
    queryKey: movieKeys.category(`infinite-${category}-${pageSize}-${sortBy}`),
    queryFn: ({ pageParam = 1 }) =>
      MoviesAPI.fetchMoviesByCategory(category, pageParam, pageSize, sortBy),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, allPages) => {
      if (lastPage && lastPage.movies && lastPage.movies.length < pageSize) {
        return undefined;
      }
      return allPages.length + 1;
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
};

// Library movies
export const useLibraryMovies = () => {
  return useQuery({
    queryKey: movieKeys.library(),
    queryFn: MoviesAPI.fetchLibraryMovies,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// favorite movies
export const useFavoriteMovies = () => {
  return useQuery({
    queryKey: ["movies", "favorites"],
    queryFn: MoviesAPI.fetchFavoriteMovies,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Trending movies
export const useTrendingMovies = () => {
  return useQuery({
    queryKey: movieKeys.trending(),
    queryFn: MoviesAPI.fetchTrendingMovies,
    staleTime: 30 * 60 * 1000, // 30 minutes - trending doesn't change often
  });
};

// Popular movies
export const usePopularMovies = () => {
  return useQuery({
    queryKey: ["movies", "popular"],
    queryFn: MoviesAPI.fetchPopularMovies,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Movie details
export const useMovieDetails = (movieId: string) => {
  return useQuery({
    queryKey: movieKeys.detail(movieId),
    queryFn: () => MoviesAPI.fetchMovieById(movieId),
    enabled: !!movieId,
    // Allow component-level handling (redirect on 404) instead of throwing to route errorElement
    throwOnError: false,
    // Don't retry 404s; avoid double flashes before redirect
    retry: (failureCount, error: any) => {
      const status = error?.response?.status ?? error?.status;
      if (status === 404) return false;
      return failureCount < 1;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutations
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      movieId,
      inFavorite,
    }: {
      movieId: string;
      inFavorite: boolean;
    }) => MoviesAPI.toggleFavorite(movieId, inFavorite),
    onMutate: async ({ movieId, inFavorite }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: movieKeys.all });

      // Save previous state for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: movieKeys.all });

      // Update all queries containing movies
      queryClient.setQueriesData(
        { queryKey: movieKeys.all },
        (old: any) => {
          if (!old) return old;
          
          // Handle arrays (like popular, trending, favorites)
          if (Array.isArray(old)) {
            return old.map(m => m.id === movieId ? { ...m, inFavorite: !inFavorite } : m);
          }
          
          // Handle single movie details
          if (old.id && old.id === movieId) {
            return { ...old, inFavorite: !inFavorite };
          }
          
          // Handle infinite queries (pages of movies)
          if (old.pages && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map((page: any) => {
                if (Array.isArray(page)) {
                   return page.map(m => m.id === movieId ? { ...m, inFavorite: !inFavorite } : m);
                }
                if (page && Array.isArray(page.movies)) {
                   return {
                     ...page,
                     movies: page.movies.map((m: any) => m.id === movieId ? { ...m, inFavorite: !inFavorite } : m)
                   };
                }
                return page;
              })
            };
          }
          
          return old;
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Revert optimistic update on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, { movieId }) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: movieKeys.detail(movieId.toString()),
      });
      queryClient.invalidateQueries({ queryKey: movieKeys.favorites() });
    },
  });
};

export const useToggleLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      movieId,
      inLibrary,
    }: {
      movieId: string;
      inLibrary: boolean;
    }) => MoviesAPI.toggleLibrary(movieId, inLibrary),
    onMutate: async ({ movieId, inLibrary }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: movieKeys.all });

      // Save previous state for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: movieKeys.all });

      // Update all queries containing movies
      queryClient.setQueriesData(
        { queryKey: movieKeys.all },
        (old: any) => {
          if (!old) return old;
          
          // Handle arrays (like popular, trending, favorites)
          if (Array.isArray(old)) {
            return old.map(m => m.id === movieId ? { ...m, inLibrary: !inLibrary } : m);
          }
          
          // Handle single movie details
          if (old.id && old.id === movieId) {
            return { ...old, inLibrary: !inLibrary };
          }
          
          // Handle infinite queries (pages of movies)
          if (old.pages && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map((page: any) => {
                if (Array.isArray(page)) {
                   return page.map(m => m.id === movieId ? { ...m, inLibrary: !inLibrary } : m);
                }
                if (page && Array.isArray(page.movies)) {
                   return {
                     ...page,
                     movies: page.movies.map((m: any) => m.id === movieId ? { ...m, inLibrary: !inLibrary } : m)
                   };
                }
                return page;
              })
            };
          }
          
          return old;
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Revert optimistic update on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, { movieId }) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: movieKeys.detail(movieId.toString()),
      });
      queryClient.invalidateQueries({ queryKey: movieKeys.library() });
    },
  });
};

export const useRateMovie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ movieId, rating }: { movieId: string; rating: number }) =>
      MoviesAPI.rateMovie(movieId, rating),
    onMutate: async ({ movieId, rating }) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: movieKeys.detail(movieId.toString()),
      });

      const previousMovie = queryClient.getQueryData(
        movieKeys.detail(movieId.toString()),
      );

      queryClient.setQueryData(
        movieKeys.detail(movieId.toString()),
        (old: any) => {
          if (old) {
            return { ...old, userRating: rating };
          }
          return old;
        },
      );

      return { previousMovie };
    },
    onError: (_err, { movieId }, context) => {
      // Revert optimistic update on error
      if (context?.previousMovie) {
        queryClient.setQueryData(
          movieKeys.detail(movieId.toString()),
          context.previousMovie,
        );
      }
    },
    onSettled: (_data, _error, { movieId }) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: movieKeys.detail(movieId.toString()),
      });
    },
  });
};

export const useClearLocalRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: string) => MoviesAPI.clearLocalRating(movieId),
    onMutate: async (movieId: string) => {
      await queryClient.cancelQueries({
        queryKey: movieKeys.detail(movieId.toString()),
      });

      const previousMovie = queryClient.getQueryData(
        movieKeys.detail(movieId.toString()),
      );

      queryClient.setQueryData(
        movieKeys.detail(movieId.toString()),
        (old: any) => {
          if (old) {
            return { ...old, userRating: 0 };
          }
          return old;
        },
      );

      return { previousMovie };
    },
    onError: (_err, movieId, context) => {
      if (context?.previousMovie) {
        queryClient.setQueryData(
          movieKeys.detail(movieId.toString()),
          context.previousMovie,
        );
      }
    },
    onSettled: (_data, _error, movieId) => {
      queryClient.invalidateQueries({
        queryKey: movieKeys.detail(movieId.toString()),
      });
    },
  });
};

// Video readiness check hook with polling
export const useVideoReadiness = (
  movieId: string | number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: movieKeys.videoReadiness(movieId),
    queryFn: () => MoviesAPI.checkVideoReadiness(movieId),
    enabled: enabled && !!movieId,
    refetchInterval: (query) => {
      // Poll every 2 seconds if video is not ready, stop polling when ready
      return query.state.data?.isReady ? false : 2000;
    },
    staleTime: 0, // Always refetch
    gcTime: 1000, // Short cache time
    retry: 3,
    retryDelay: 1000,
  });
};
