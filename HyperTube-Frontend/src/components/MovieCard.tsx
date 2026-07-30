import React from "react";
import type { Movie } from "@/types/Movie";
import { Play, Star } from "lucide-react";
import { motion } from "framer-motion";

interface MovieCardProps {
  movie: Movie;
  idx: number;
  onClick?: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, idx, onClick }) => {
  return (
    <motion.button
      key={`${movie.id}-${idx}`}
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      onClick={() => {
        onClick?.(movie);
      }}
      aria-label={`Open ${movie.title}${movie.releaseYear ? ` (${movie.releaseYear})` : ""}`}
      className={`group w-full text-left bg-transparent p-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-100/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-2xl ${movie.isWatched ? "opacity-60" : "opacity-100"}`}
    >
      {/* Poster */}
      <div className="relative mb-3">
        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-900 shadow-xl">
          <img
            src={movie.poster ?? "/poster-placeholder.png"}
            alt={`Poster of ${movie.title}`}
            draggable={false}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ease-in-out"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (!target.src.endsWith("/poster-placeholder.png")) {
                target.src = "/poster-placeholder.png";
              }
            }}
          />

          {/* Glassy hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="
          absolute inset-0 bg-white/10 backdrop-blur-[2px] rounded-2xl
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300 ease-in-out
          "
            />
            <div
              className="
          relative z-10 w-16 h-16 bg-secondary-100/90 backdrop-blur-xl
          rounded-full flex items-center justify-center shadow-lg
          border-2 border-primary-100
          opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100
          transition-all duration-300 ease-in-out
          "
              aria-hidden="true"
            >
              <Play className="w-7 h-7 text-white fill-primary-100/90" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="z-0 w-16 h-16 rounded-full border-2 border-secondary-100/70 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300" />
            </div>
          </div>

          {/* Watched badge on poster */}
          {movie.isWatched && (
            <div className="absolute top-2 right-2 z-10">
              <span className="rounded-full bg-primary-100/90 text-white text-xs font-semibold px-2 py-1 shadow">
                Watched
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Movie Info */}
      <div className="px-1">
        <h3
          className="font-bold text-lg text-white mb-1 truncate group-hover:text-cyan-400 transition-colors duration-300"
          title={movie.title}
        >
          {movie.title}
        </h3>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          {movie.releaseYear && <span>{movie.releaseYear}</span>}

          <span className="select-none">•</span>

          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>
              {Number.isFinite(Number(movie.rating))
                ? Number(movie.rating).toFixed(1)
                : "—"}
            </span>
            {typeof movie.totalRatings === "number" &&
              movie.totalRatings > 0 && (
                <span className="text-gray-500">
                  ({movie.totalRatings.toLocaleString()})
                </span>
              )}
          </div>

          {Number.isFinite(Number(movie.averageRating)) && (
            <>
              <span className="select-none">•</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary-100 text-primary-100" />
                <span>{Number(movie.averageRating).toFixed(1)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default React.memo(MovieCard, (prevProps, nextProps) => {
  return (
    prevProps.movie.id === nextProps.movie.id &&
    prevProps.movie.inFavorite === nextProps.movie.inFavorite &&
    prevProps.movie.inLibrary === nextProps.movie.inLibrary &&
    prevProps.movie.isWatched === nextProps.movie.isWatched &&
    prevProps.idx === nextProps.idx &&
    prevProps.onClick === nextProps.onClick
  );
});
