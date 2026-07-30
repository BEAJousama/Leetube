import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  useInfiniteMovies,
  useInfiniteMoviesByCategory,
} from "@/hooks/UseMoviesQuery";
import MoviesGrid from "@/components/MoviesGrid";
import CategoryNav from "@/components/CategoryNav";
import MovieCategories from "@/types/constants/MovieCategories";
import HeroSection from "@/components/HomeHeroSection/HeroSection";
import TrailerModal from "@/components/TrailerModal";
import { useOverlayStore } from "@/stores/OverlayStore";
import { useAuthStore } from "@/stores/AuthStore";
import { SORT_OPTIONS } from "@/types/constants/SearchFilters";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { MoviesAPI } from "@/api/MoviesApi";

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSort, setSelectedSort] = useState<string>(
    SORT_OPTIONS.POPULARITY,
  );
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { verificationMessage, clearVerificationMessage } = useAuthStore();

  // Clear verification message after 5 seconds
  useEffect(() => {
    if (verificationMessage) {
      const timer = setTimeout(() => {
        clearVerificationMessage();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [verificationMessage, clearVerificationMessage]);

  // Use infinite query for all movies
  const {
    data: allMoviesData,
    fetchNextPage: fetchNextAllMovies,
    hasNextPage: hasNextAllMovies,
    isFetchingNextPage: isFetchingNextAllMovies,
    isLoading: allMoviesLoading,
    error: allMoviesError,
  } = useInfiniteMovies(20, selectedSort);

  // Use infinite query for category movies
  const {
    data: categoryMoviesData,
    fetchNextPage: fetchNextCategoryMovies,
    hasNextPage: hasNextCategoryMovies,
    isFetchingNextPage: isFetchingNextCategoryMovies,
    isLoading: categoryMoviesLoading,
    error: categoryMoviesError,
  } = useInfiniteMoviesByCategory(
    selectedCategory !== "All" ? selectedCategory : "",
    20,
    selectedSort,
  );

  // Flatten the infinite data into a single movies array
  const {
    movies,
    isLoading,
    // error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMemo(() => {
    if (selectedCategory === "All") {
      const flatMovies =
        allMoviesData?.pages?.flatMap((page) =>
          Array.isArray(page) ? page : page?.movies || [],
        ) || [];

      return {
        movies: flatMovies,
        isLoading: allMoviesLoading,
        error: allMoviesError,
        fetchNextPage: fetchNextAllMovies,
        hasNextPage: hasNextAllMovies,
        isFetchingNextPage: isFetchingNextAllMovies,
      };
    } else {
      const flatMovies =
        categoryMoviesData?.pages?.flatMap((page) =>
          Array.isArray(page) ? page : page?.movies || [],
        ) || [];

      return {
        movies: flatMovies,
        isLoading: categoryMoviesLoading,
        error: categoryMoviesError,
        fetchNextPage: fetchNextCategoryMovies,
        hasNextPage: hasNextCategoryMovies,
        isFetchingNextPage: isFetchingNextCategoryMovies,
      };
    }
  }, [
    selectedCategory,
    allMoviesData,
    allMoviesLoading,
    allMoviesError,
    fetchNextAllMovies,
    hasNextAllMovies,
    isFetchingNextAllMovies,
    categoryMoviesData,
    categoryMoviesLoading,
    categoryMoviesError,
    fetchNextCategoryMovies,
    hasNextCategoryMovies,
    isFetchingNextCategoryMovies,
  ]);

  // Intersection Observer for infinite scroll
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  // Set up intersection observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: "50px",
    });

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [handleIntersection]);

  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const openTrailer = useOverlayStore((s) => s.openTrailer);

  return (
    <div className="flex flex-col gap-6 m-6">
      {/* Verification Message */}
      {verificationMessage && (
        <div
          className={`p-4 rounded-lg border flex items-center space-x-3 ${
            verificationMessage.type === "success"
              ? "bg-green-500/20 border-green-500/50"
              : verificationMessage.type === "already-verified"
                ? "bg-blue-500/20 border-blue-500/50"
                : "bg-red-500/20 border-red-500/50"
          }`}
        >
          {verificationMessage.type === "success" && (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          {verificationMessage.type === "already-verified" && (
            <AlertCircle className="w-5 h-5 text-blue-400" />
          )}
          {verificationMessage.type === "error" && (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <p
            className={`text-sm font-medium ${
              verificationMessage.type === "success"
                ? "text-green-200"
                : verificationMessage.type === "already-verified"
                  ? "text-blue-200"
                  : "text-red-200"
            }`}
          >
            {verificationMessage.message}
          </p>
        </div>
      )}

      <HeroSection
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        onTrailerPlay={async (trailerUrl, movieId) => {
          if (trailerUrl) {
            openTrailer(trailerUrl);
          } else if (movieId) {
            try {
              const movie = await MoviesAPI.fetchMovieById(movieId);
              if (movie && movie.trailerUrl) {
                openTrailer(movie.trailerUrl);
              } else {
                openTrailer(null);
              }
            } catch (e) {
              openTrailer(null);
            }
          } else {
            openTrailer(null);
          }
        }}
      />
      <CategoryNav
        categories={MovieCategories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
      />
      <div>
        <MoviesGrid
          movies={movies}
          loading={isLoading || isFetchingNextPage}
          sentinelRef={sentinelRef}
        />
      </div>
      <TrailerModal />
    </div>
  );
};
export default HomePage;
