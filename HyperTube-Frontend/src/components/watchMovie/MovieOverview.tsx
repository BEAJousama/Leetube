import { type Movie } from "@/types/Movie";
import { useTranslation } from "react-i18next";

interface MovieOverviewProps {
  movie: Movie;
  loading?: boolean;
}

export function MovieOverview({ movie, loading = false }: MovieOverviewProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <section className="space-y-2 bg-white/5 rounded-xl backdrop-blur-xs p-3 shadow-md shadow-black/20 animate-pulse">
        <div className="w-2/3 h-6 bg-white/10 rounded mb-2" />
        <div className="w-full h-4 bg-white/10 rounded mb-2" />
        <div className="w-3/4 h-4 bg-white/10 rounded mb-2" />
      </section>
    );
  }
  return (
    <section className="space-y-2 bg-white/5 rounded-xl backdrop-blur-xs p-3 shadow-md shadow-black/20">
      <h2 className="text-2xl font-semibold text-white">
        {t("MoviePage.overview")}
      </h2>
      <p className="text-white/80 ml-3">
        {movie.description || t("MoviePage.noDescription")}
      </p>
    </section>
  );
}
