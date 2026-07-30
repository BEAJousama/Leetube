import MoviesPage from "@/components/MoviesPage";
import { TrendingUp } from "lucide-react";
import { useTrendingMovies } from "@/hooks/UseMoviesQuery";
import { useTranslation } from "react-i18next";

export default function TrendingPage() {
  const { data: movies = [], isLoading } = useTrendingMovies();
  const { t } = useTranslation();

  return (
    <MoviesPage
      icon={<TrendingUp className="w-16 h-16 text-primary-100" />}
      title={t("TrendingPage.HeroSection.title")}
      description={t("TrendingPage.HeroSection.subtitle")}
      tags={[
        t("TrendingPage.HeroSection.tags.popularNow"),
        t("TrendingPage.HeroSection.tags.mustWatch"),
        t("TrendingPage.HeroSection.tags.hotRightNow"),
      ]}
      movies={movies}
      isLoading={isLoading}
      emptyIcon={
        <TrendingUp className="w-18 h-18 text-primary-100 opacity-50" />
      }
      emptyTitle={t("TrendingPage.emptyTitle")}
      emptySubtitle={t("TrendingPage.emptySubtitle")}
    />
  );
}
