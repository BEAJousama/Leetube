import type { Movie } from "@/types/Movie";
import MovieCard from "./MovieCard";
import React from "react";
import { useNavigate } from "react-router-dom";

interface MoviesGridProps {
  movies: Movie[];
  loading: boolean;
  sentinelRef?: React.RefObject<HTMLDivElement | null>;
}

const MoviesGrid = ({ movies, loading, sentinelRef }: MoviesGridProps) => {
  const navigate = useNavigate();

  const handleOnclick = React.useCallback((movie: Movie) => {
    navigate(`/movie/${movie.id}`);
  }, [navigate]);

  // Deduplicate movies by ID to ensure stable keys across infinite scroll pages
  const uniqueMovies = React.useMemo(() => {
    const seen = new Set();
    return movies.filter((movie) => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    });
  }, [movies]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
      {uniqueMovies.map((movie, idx) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          idx={idx}
          onClick={handleOnclick}
        />
      ))}

      {loading && (
        <>
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 bg-white/5 rounded-lg animate-pulse w-full"
              style={{ minWidth: 0 }}
            >
              {/* Portrait poster skeleton: 2:3 aspect ratio */}
              <div className="w-full aspect-[3/4] bg-white/10 rounded-t-lg" />
              <div className="h-6 w-3/4 bg-white/10 rounded mx-2" />
            </div>
          ))}
        </>
      )}

      {/* Sentinel for infinite scrolling */}
      {sentinelRef && (
        <div
          ref={sentinelRef}
          className="col-span-full h-0 flex justify-center items-center"
        >
          {/* Optional: Add loading text when fetching more */}
          {/* <div className="text-white/50 text-sm">{t("LoadMoreMovies")}</div> */}
        </div>
      )}
    </div>
  );
};

export default MoviesGrid;
