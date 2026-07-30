import "@/index.css";
import { useMemo, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { API_BASE_URL } from "../../Env";
import { MoviesAPI } from "@/api/MoviesApi";
import type { Movie } from "@/types/Movie";
import { Navigate, useParams } from "react-router-dom";
import {
  useMovieDetails,
  useToggleFavorite,
  useToggleLibrary,
} from "@/hooks/UseMoviesQuery";
import TrailerModal from "@/components/TrailerModal";
import { useOverlayStore } from "@/stores/OverlayStore";
import CommentsSection from "@/components/watchMovie/CommentsSection";
import { MovieOverview } from "@/components/watchMovie/MovieOverview";
import { MovieHeader } from "@/components/watchMovie/MovieHeader";
import { MoviePlayer } from "@/components/watchMovie/MoviePlayer";
import { useTranslation } from "react-i18next";
import CastSection from "@/components/watchMovie/CastSection";
import { useAuth } from "@/stores/AuthStore";

interface ErrorStateProps {
  error: Error | null;
}

const ErrorState = ({ error }: ErrorStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-semibold text-red-400">
        {t("MoviePage.ErrorLoading")}
      </h2>
      <p className="text-white/70 mt-2">
        {error instanceof Error
          ? error.message
          : t("MoviePage.ErrorLoadingMsg")}
      </p>
      <Button
        label={t("MoviePage.TryAgain")}
        onClick={() => window.location.reload()}
        variant="Primary"
        className="mt-4"
      />
    </div>
  );
};

const MovieWatchPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const movieId = useMemo(() => Number(id), [id]);
  const [isMkv, setIsMkv] = useState(false);
  const { user } = useAuth();
  const {
    data: movie,
    isLoading,
    error,
  }: {
    data: Movie | undefined;
    isLoading: boolean;
    error: Error | null;
  } = useMovieDetails(id!);

  const toggleFavoriteMutation = useToggleFavorite();
  const toggleLibraryMutation = useToggleLibrary();
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const lastAnnouncedKey = useRef<string | null>(null);

  const openTrailerModal = useOverlayStore((s) => s.openTrailer);

  useEffect(() => {
    if (!movie || !movie.sources) return;
    const bestMagnet = movie.sources.bestTorrent?.magnet;
    const firstTorrentMagnet =
      Array.isArray(movie.sources.torrents) && movie.sources.torrents.length > 0
        ? movie.sources.torrents[0].magnet
        : "";
    const magnet = bestMagnet || firstTorrentMagnet || "";
    if (!magnet) return;

    const key = `${movie.id}:${magnet}`;
    if (lastAnnouncedKey.current === key) return; // already announced for this movie+magnet
    lastAnnouncedKey.current = key;

    (async () => {
      try {
        setIsAnnouncing(true);
        const res = await MoviesAPI.announceMovie({
          movieId: movie.id,
          magnet,
          userId: user.id,
        });
        if (res?.metadata?.extension === ".mkv") {
          setIsMkv(true);
        }
      } catch (_err) {
        // Silently ignore announce errors for now. Could add toast/log.
      } finally {
        setIsAnnouncing(false);
      }
    })();
  }, [movie, user.id]);

  const mergedMovie = useMemo(() => {
    if (!movie) return movie;
    return {
      ...movie,
      userRating: movie.userRating,
    } as Movie;
  }, [movie]);

  if (Number.isNaN(movieId)) return <Navigate to="/404" replace />;
  if ((error as any)?.response?.status === 404)
    return <Navigate to="/404" replace />;
  if (error) return <ErrorState error={error} />;
  if (!movie && !isLoading) return <Navigate to="/404" replace />;

  const toggleFavorite = async () => {
    if (!movie) return;
    try {
      await toggleFavoriteMutation.mutateAsync({
        movieId: movie.id,
        inFavorite: movie.inFavorite,
      });
    } catch (_error) {
      // Error handling could be expanded here
    }
  };

  const toggleLibrary = async () => {
    if (!movie) return;
    try {
      await toggleLibraryMutation.mutateAsync({
        movieId: movie.id,
        inLibrary: movie.inLibrary,
      });
    } catch (_error) {
      // Error handling could be expanded here
    }
  };

  // Check if movie has sources available
  const hasSource = Boolean(
    movie &&
      movie.sources &&
      (movie.sources.bestTorrent?.magnet ||
        (Array.isArray(movie.sources.torrents) &&
          movie.sources.torrents.length > 0)),
  );

  // Video source (replace with your actual streaming URL)
  const videoSrc =
    hasSource && movie
      ? API_BASE_URL + "/api/torrent/stream?movieId=" + movie.id
      : "";
  // remove crossorigin

  // "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  // For real implementation: API_BASE_URL + "m?movieId=" + movie.id;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* No sources notification banner */}
      {!hasSource && !isLoading && (
        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 text-yellow-400">⚠️</div>
            <div>
              <h4 className="text-yellow-400 font-medium text-sm">
                {t("MoviePage.noSourcesBannerTitle")}
              </h4>
              <p className="text-yellow-200/80 text-xs mt-1">
                {t("MoviePage.noSourcesBannerMessage")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      <MoviePlayer
        videoSrc={videoSrc}
        poster={movie?.backdrop}
        title={movie?.title || ""}
        hasSource={hasSource}
        loading={isLoading}
        movieId={movie?.id?.toString()}
        isAnnouncing={isAnnouncing}
        isMkv={isMkv}
      />

      {/* Movie Header with Actions */}
      <MovieHeader
        movie={mergedMovie as Movie}
        onWatchTrailer={() => openTrailerModal(movie?.trailerUrl || null)}
        onToggleLibrary={toggleLibrary}
        onToggleFavorite={toggleFavorite}
        isLibraryLoading={toggleLibraryMutation.isPending}
        isFavoriteLoading={toggleFavoriteMutation.isPending}
        loading={isLoading}
        downloadUrl={videoSrc ? videoSrc + "&download=true" : undefined}
      />

      {/* Movie Overview */}
      <MovieOverview movie={mergedMovie as Movie} loading={isLoading} />

      {/* Cast Section */}
      <CastSection cast={mergedMovie?.cast} loading={isLoading} />

      {/* Comments Section */}
      <CommentsSection movieId={movieId} />

      {/* Trailer Modal */}
      <TrailerModal />
    </div>
  );
};

export default MovieWatchPage;
