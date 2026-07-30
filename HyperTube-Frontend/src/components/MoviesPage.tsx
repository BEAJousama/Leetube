import React from "react";
import InfoBanner from "@/components/ui/InfoBanner";
import MoviesGrid from "@/components/MoviesGrid";
import type { Movie } from "@/types/Movie";
import clsx from "clsx";
import { t } from "i18next";

interface MoviesPageProps {
  // Hero/Info
  icon?: React.ReactNode;
  title: string;
  description: string;
  tags?: string[];
  // Lead paragraph below banner
  leadText?: string;
  // Data
  movies: Movie[];
  isLoading?: boolean;
  // Empty state customization
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  // Styling hooks
  containerClassName?: string;
  contentClassName?: string;
}

const MoviesPage: React.FC<MoviesPageProps> = ({
  icon,
  title,
  description,
  tags = [],
  leadText,
  movies,
  isLoading = false,
  emptyIcon,
  emptyTitle = t("MoviesPage.emptyTitle"),
  emptySubtitle = t("MoviesPage.emptySubtitle"),
  containerClassName,
  contentClassName,
}) => {
  if (isLoading)
    return (
      <div
        className={clsx(
          "p-6 min-h-screen w-full flex flex-col items-center pb-16",
          containerClassName,
        )}
      >
        <InfoBanner
          icon={icon}
          title={title}
          description={description}
          tags={tags}
          className="mb-12"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 bg-black/10 rounded-lg animate-pulse w-full"
              style={{ minWidth: 0 }}
            >
              {/* Portrait poster skeleton: 2:3 aspect ratio */}
              <div className="w-full aspect-[3/4] bg-black/20 rounded-t-lg" />
              <div className="h-6 w-3/4 bg-black/20 rounded mx-2" />
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div
      className={clsx(
        "p-6 min-h-screen w-full flex flex-col items-center pb-16",
        containerClassName,
      )}
    >
      <InfoBanner
        icon={icon}
        title={title}
        description={description}
        tags={tags}
        className="mb-12"
      />

      {leadText && (
        <p className="text-lg text-white/70 mb-8 text-center max-w-2xl mx-auto">
          {leadText}
        </p>
      )}

      <div className={clsx("w-full", contentClassName)}>
        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            {emptyIcon && <span className="mb-6">{emptyIcon}</span>}
            <p className="text-2xl text-white/80 font-bold">{emptyTitle}</p>
            <p className="text-white/60 mt-2 text-lg">{emptySubtitle}</p>
          </div>
        ) : (
          <MoviesGrid movies={movies} loading={false} />
        )}
      </div>
    </div>
  );
};

export default MoviesPage;
