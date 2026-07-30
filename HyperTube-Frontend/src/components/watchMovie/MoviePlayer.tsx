import { useRef, useState, useEffect, useCallback } from "react";
import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/stores/AuthStore";
import { Loading } from "@/components/ui/Loading";
import { API_BASE_URL } from "../../../Env";

interface MoviePlayerProps {
  videoSrc: string;
  poster: string;
  title: string;
  maxWidthClass?: string; // allow override if needed
  hasSource?: boolean; // whether video source is available
  loading?: boolean;
  movieId?: string;
  isAnnouncing?: boolean;
  isMkv?: boolean;
}

// Utils
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ar: "العربية",
};

const getLanguageLabel = (lang: string): string =>
  LANGUAGE_LABELS[lang] || lang.toUpperCase();

// Hooks
function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean | undefined>(undefined);

  const handleCenterPlay = useCallback(() => {
    setIsPlaying(true);
    // Allow React state to update the src attribute before calling play
    setTimeout(async () => {
      try {
        await videoRef.current?.play();
      } catch (_e) {}
    }, 100);
  }, []);

  return { videoRef, isPlaying, setIsPlaying, handleCenterPlay };
}

function useSubtitles(movieId?: string, preferredLanguage: string = "en") {
  const [subtitlesAvailable, setSubtitlesAvailable] = useState<boolean>(false);
  const [availableSubtitleLangs, setAvailableSubtitleLangs] = useState<
    string[]
  >([]);
  const [defaultSubtitleLang, setDefaultSubtitleLang] = useState<string>("en");
  const [subtitlesLoading, setSubtitlesLoading] = useState<boolean>(false);
  const [subtitlesDownloaded, setSubtitlesDownloaded] =
    useState<boolean>(false);

  const checkSubtitles = useCallback(async () => {
    if (!movieId) return false;

    try {
      const allLanguages = ["en", "es", "fr", "de", "ar"];
      const availableLangs: string[] = [];

      // Check each language using the backend API
      for (const lang of allLanguages) {
        try {
          const response = await fetch(
            `/api/torrent/check-subtitles?tmdbId=${movieId}&language=${lang}`,
            {
              method: "GET",
              cache: "no-cache",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            if (data.available && data.downloaded) {
              availableLangs.push(lang);
            }
          }
          // Silently handle non-200 responses
        } catch (_error) {
          // Silently handle API errors for this language
          // This prevents console errors while still checking other languages
        }
      }

      if (availableLangs.length > 0) {
        setSubtitlesAvailable(true);
        setAvailableSubtitleLangs(availableLangs);
        setSubtitlesDownloaded(true);

        const defaultLang = availableLangs.includes(preferredLanguage)
          ? preferredLanguage
          : availableLangs[0];
        setDefaultSubtitleLang(defaultLang);

        return true;
      } else {
        setSubtitlesAvailable(false);
        setAvailableSubtitleLangs([]);
        return false;
      }
    } catch (_error) {
      // Silently handle any unexpected errors
      setSubtitlesAvailable(false);
      setAvailableSubtitleLangs([]);
      return false;
    }
  }, [movieId, preferredLanguage]);

  useEffect(() => {
    if (!movieId) return;

    let pollCount = 0;
    const maxPolls = 20; // Poll for up to 20 times (40 seconds)
    const pollInterval = 6000; // Check every 6 seconds

    setSubtitlesLoading(true);

    const pollForSubtitles = async () => {
      const found = await checkSubtitles();

      if (found) {
        setSubtitlesLoading(false);
        return;
      }

      pollCount++;

      if (pollCount < maxPolls) {
        // Continue polling
        setTimeout(pollForSubtitles, pollInterval);
      } else {
        // Stop polling after max attempts
        setSubtitlesLoading(false);
      }
    };

    // Start polling
    pollForSubtitles();

    // Cleanup
    return () => {
      pollCount = maxPolls; // Stop polling on unmount
    };
  }, [movieId, preferredLanguage, checkSubtitles]);

  useEffect(() => {
    if (!subtitlesDownloaded) return;
    const timer = setTimeout(() => setSubtitlesDownloaded(false), 3000);
    return () => clearTimeout(timer);
  }, [subtitlesDownloaded]);

  return {
    subtitlesAvailable,
    availableSubtitleLangs,
    defaultSubtitleLang,
    subtitlesLoading,
    subtitlesDownloaded,
  };
}

// UI
export function MoviePlayer({
  videoSrc,
  poster,
  title,
  maxWidthClass = "max-w-[900px] md:max-w-[1100px] xl:max-w-[1280px]",
  hasSource = true,
  loading = false,
  movieId,
  isAnnouncing = false,
  isMkv = false,
}: MoviePlayerProps) {
  const { t } = useTranslation();
  const user = useAuth().user;

  const { videoRef, isPlaying, setIsPlaying, handleCenterPlay } =
    useVideoPlayer();

  if (loading) {
    return (
      <div
        className={`relative w-full mx-auto ${maxWidthClass} aspect-video bg-white/10 rounded-2xl overflow-hidden border border-white/10 shadow-xl max-h-[80vh] flex items-center justify-center animate-pulse`}
      ></div>
    );
  }

  if (!hasSource) {
    return (
      <div
        className={`relative w-full mx-auto ${maxWidthClass} aspect-video
          bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl overflow-hidden 
          border border-red-500/30 shadow-xl max-h-[80vh] flex items-center justify-center`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${poster})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40" />
        <div className="relative z-10 text-center p-8 max-w-md">
          <div className="mb-6"></div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
            <Play className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {t("MoviePage.noSourcesTitle")}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            {t("MoviePage.noSourcesMessage")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full mx-auto ${maxWidthClass} aspect-video
         rounded-2xl overflow-hidden border border-white/10 shadow-xl
        max-h-[80vh]
        ${!isAnnouncing ? "bg-black" : "bg-white/5"}
        `}
    >
      {isAnnouncing ? (
        <div className="flex justify-center items-center h-full">
          <Loading />
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={isPlaying === undefined ? undefined : videoSrc}
            key={videoSrc}
            data-no-seek={isMkv ? "true" : "false"}
            poster={poster}
            controls
            className={`w-full h-full object-cover bg-black`}
            preload="metadata"
            crossOrigin="anonymous"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            autoPlay={false}
          >
            {movieId &&
              ["en", "es", "fr", "de", "ar"].map((lang) => (
                <track
                  key={lang}
                  kind="subtitles"
                  src={`${API_BASE_URL}/api/torrent/subtitles/${movieId}/${lang}.vtt`}
                  srcLang={lang}
                  label={getLanguageLabel(lang)}
                  default={lang === (user?.preferredLanguage || "en")}
                />
              ))}
          </video>

          {!isPlaying && (
            <button
              aria-label={`Play ${title}`}
              onClick={handleCenterPlay}
              className="absolute inset-0 flex flex-col gap-1.5 items-center justify-center z-20 cursor-pointer"
            >
              <div
                className="
                w-12 md:w-16 lg:w-20 h-12 md:h-16 lg:h-20 2xl:w-24 2xl:h-24 bg-secondary-100/80 opacity-80 backdrop-blur-xl
                rounded-full flex items-center justify-center shadow-lg
                border-2 border-primary-100
              "
              >
                <Play className="w-6 md:w-8 lg:w-10 h-6 md:h-8 lg:h-10 2xl:w-12 2xl:h-12 text-white fill-primary-100/90" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="z-0 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 2xl:w-24 2xl:h-24 rounded-full border-2 border-secondary-100/70 opacity-100 animate-ping transition-all duration-2000" />
              </div>
            </button>
          )}
        </>
      )}
    </div>
  );
}
