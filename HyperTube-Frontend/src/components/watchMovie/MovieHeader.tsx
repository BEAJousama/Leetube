import { Star, Clock, Popcorn, Heart, Play, Download } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { FormatDuration } from "@/utils/FormatDuration";
import type { Movie } from "@/types/Movie";
import { useTranslation } from "react-i18next";
import { useClearLocalRating, useRateMovie } from "@/hooks/UseMoviesQuery";

interface MovieHeaderProps {
  movie: Movie;
  onWatchTrailer: () => void;
  onToggleLibrary: () => void;
  onToggleFavorite: () => void;
  isLibraryLoading: boolean;
  isFavoriteLoading: boolean;
  loading?: boolean;
  downloadUrl?: string;
}

export function MovieHeader({
  movie,
  onWatchTrailer,
  onToggleLibrary,
  onToggleFavorite,
  isLibraryLoading,
  isFavoriteLoading,
  loading = false,
  downloadUrl,
}: MovieHeaderProps) {
  const { t } = useTranslation();
  const rateMutation = useRateMovie();
  const clearRateMutation = useClearLocalRating();
  if (loading) {
    return (
      <header className="text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-pulse">
        <div className="space-y-1 flex-1">
          <div className="w-2/3 h-8 bg-white/10 rounded mb-2" />
          <div className="w-1/2 h-4 bg-white/10 rounded mb-2" />
        </div>
        <div className="w-32 h-8 bg-white/10 rounded mb-2" />
      </header>
    );
  }
  const onRate = (val: number) => {
    // localStorage fallback
    // /api/movies/:id/rate
    try {
      // window.localStorage.setItem(key, String(movie.userRating/2));
      rateMutation.mutate({ movieId: movie.id, rating: val * 2 });
    } catch {}
  };
  const onClearRate = () => {
    try {
      clearRateMutation.mutate(movie.id);
      // window.localStorage.removeItem(key);
    } catch {}
  };

  return (
    <header className="text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-1 flex-1">
        <h1 className="text-2xl md:text-3xl font-bold">{movie.title}</h1>
        <div className="flex items-center gap-3 text-white/70 flex-wrap">
          <span>{movie.releaseYear}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{" "}
            {parseFloat(movie.rating.toString()).toFixed(1)}/10
          </span>
          <span className="hidden md:inline text-white/40">|</span>
          <div className="flex items-center gap-2">
            <StarRating
              value={
                movie.userRating && movie.userRating > 0
                  ? movie.userRating / 2
                  : undefined
              }
              onChange={onRate}
              onClear={onClearRate}
              size={18}
              // disabled={}
            />
          </div>
          {movie.rated && (
            <>
              <span>•</span>
              <span className="px-1.5 py-0.5 rounded border border-white/20 text-xs">
                {movie.rated}
              </span>
            </>
          )}
          {movie.averageRating && (
            <>
              <span className="hidden md:inline text-white/40">|</span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary-100 text-primary-100" />{" "}
                {parseFloat(movie.averageRating?.toString()).toFixed(1)}
                <span>({movie.totalRatings || 0})</span>
              </span>
            </>
          )}
          {movie.runtime && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {FormatDuration(movie.runtime)}
              </span>
            </>
          )}
        </div>
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {movie.genres.map((g) => (
              <span
                key={g}
                className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-3 flex-1 flex-wrap 2xl:justify-end">
        <Button
          label={t("MoviePage.watchTrailer")}
          onClick={onWatchTrailer}
          variant="Primary"
          className="w-fit sm:w-full sm:flex-1 2xl:flex-none 2xl:w-fit text-white/90 text-nowrap"
          icon={Play}
        />
        {downloadUrl && (
          <Button
            label={t("MoviePage.downloadMovie", "Download")}
            onClick={() => window.open(downloadUrl, "_blank")}
            variant="Secondary"
            icon={Download}
            className="w-fit sm:w-full sm:flex-1 2xl:flex-none 2xl:w-fit text-nowrap"
          />
        )}
        <Button
          isLoading={isLibraryLoading}
          label={
            movie.inLibrary
              ? t("MoviePage.inLibrary")
              : t("MoviePage.addToLibrary")
          }
          variant={movie.inLibrary ? "Secondary" : "White"}
          icon={Popcorn}
          className="w-fit sm:w-full sm:flex-1 2xl:flex-none 2xl:w-fit text-nowrap"
          onClick={onToggleLibrary}
        />
        <Button
          isLoading={isFavoriteLoading}
          label={
            movie.inFavorite
              ? t("MoviePage.inFavorites")
              : t("MoviePage.addToFavorites")
          }
          variant={movie.inFavorite ? "Secondary" : "White"}
          icon={Heart}
          className="w-fit sm:w-full sm:flex-1 2xl:flex-none 2xl:w-fit text-nowrap"
          onClick={onToggleFavorite}
        />
      </div>
    </header>
  );
}
