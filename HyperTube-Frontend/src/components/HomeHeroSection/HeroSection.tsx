import type HomeHeroSlide from "@/types/HomeHeroSlide";
import { useEffect, useCallback, useMemo } from "react";
import Dots from "./Dots";
import HeartButton from "./HeartButton";
import NavButton from "./NavButton";
import SlideCard from "./SlideCard";
import TagsBar from "./TagsBar";
import TitlePlay from "./TitlePlay";
import { usePopularMovies, useToggleFavorite } from "@/hooks/UseMoviesQuery";
import { type Movie } from "@/types/Movie";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function HeroSection(props: {
  currentSlide: number;
  setCurrentSlide: (i: number) => void;
  onTrailerPlay: (trailerUrl: string | null, movieId: string) => void;
}) {
  const { t } = useTranslation();
  const { currentSlide, setCurrentSlide } = props;
  const {
    data: trendingMovies,
    isLoading: trendingLoading,
    refetch,
  } = usePopularMovies();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Transform trending movies to hero slides format
  const slides: HomeHeroSlide[] = useMemo(() => {
    if (!trendingMovies) return [];

    return trendingMovies.slice(0, 3).map((movie: Movie) => ({
      id: movie.id,
      inFavorite: movie.inFavorite,
      image: movie.backdrop || "/poster-placeholder.png",
      title: movie.title,
      duration: movie.runtime
        ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
        : "N/A",
      genres: movie.genres || [],
      trailerUrl: movie.trailerUrl || null,
    }));
  }, [trendingMovies]);

  const { onTrailerPlay } = props;
  const len = slides.length;
  const toggleFavoriteMutation = useToggleFavorite();

  const next = useCallback(
    () => setCurrentSlide((currentSlide + 1) % len),
    [currentSlide, len, setCurrentSlide],
  );
  const prev = useCallback(
    () => setCurrentSlide((currentSlide - 1 + len) % len),
    [currentSlide, len, setCurrentSlide],
  );

  const toggleFavorite = async () => {
    const slide = slides[currentSlide];
    if (!slide) return;
    
    // Run mutation (optimistic updates are handled globally in UseMoviesQuery)
    await toggleFavoriteMutation.mutateAsync({
      movieId: slide.id,
      inFavorite: slide.inFavorite,
    });
  };

  useEffect(() => {
    if (trendingLoading) return; // pause auto-slide when loading (overlay store handles trailer state globally)
    const timer = setTimeout(
      () => setCurrentSlide((currentSlide + 1) % len),
      5000,
    );
    return () => clearTimeout(timer);
  }, [currentSlide, len, setCurrentSlide, trendingLoading]);

  return (
    <div className="w-full h-full flex justify-start backdrop-blur-xs">
      <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] xl:h-[600px] 2xl:h-[700px] 3xl:h-[900px] w-full lg:w-[80%] xl:w-[82%] 2xl:w-[90%] 3xl:w-[95%]">
        {/* Dots */}
        {!trendingLoading && (
          <Dots
            count={trendingLoading ? 3 : len}
            active={currentSlide}
            onSelect={setCurrentSlide}
          />
        )}

        {/* Stacked carousel viewport */}
        <div className="relative w-full h-full">
          <div
            onClick={() =>
              !trendingLoading &&
              slides[currentSlide]?.id &&
              navigate(`/movie/${slides[currentSlide].id}`)
            }
          >
            {trendingLoading
              ? // Show loading placeholders when data is loading
                Array.from({ length: 3 }).map((_, i) => {
                  const rel = ((i - 0) % 3) as 0 | 1 | 2;
                  if (rel > 2) return null;
                  return (
                    <SlideCard
                      key={i}
                      slide={{ title: t("Loading"), image: "" }}
                      rel={rel}
                      isLoading={true}
                    />
                  );
                })
              : slides.map((s, i) => {
                  const rel = ((i - currentSlide + len) % len) as 0 | 1 | 2; // 0=current,1=next,2=next-next
                  if (rel > 2) return null;
                  return (
                    <SlideCard key={i} slide={s} rel={rel} isLoading={false} />
                  );
                })}
          </div>

          {!trendingLoading && (
            <>
              <TagsBar
                tags={trendingLoading ? [] : slides[currentSlide]?.genres || []}
              />
              <TitlePlay
                title={
                  trendingLoading ? t("Loading") : slides[currentSlide]?.title
                }
                duration={
                  trendingLoading ? "..." : slides[currentSlide]?.duration
                }
                onPlay={() => props.onTrailerPlay(slides[currentSlide]?.trailerUrl || null, slides[currentSlide]?.id?.toString() || "")}
              />
              <HeartButton
                onClick={toggleFavorite}
                inFavorite={
                  trendingLoading ? false : slides[currentSlide]?.inFavorite
                }
                isLoading={toggleFavoriteMutation.isPending}
              />
              <NavButton direction="prev" onClick={prev} />
              <NavButton direction="next" onClick={next} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
