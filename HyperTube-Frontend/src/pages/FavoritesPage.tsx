import MoviesPage from "@/components/MoviesPage";
import { Sparkles } from "lucide-react";
import { useFavoriteMovies } from "@/hooks";
import { useTranslation } from "react-i18next";

export default function FavoritesPage() {
  const { data: movies = [], isLoading, error } = useFavoriteMovies();
  const { t } = useTranslation();

  // if (isLoading) return <div>{t("Loading")}</div>;
  if (error) return <div>{t("FavoritesPage.ErrorLoading")}</div>;

  return (
    <MoviesPage
      icon={<Sparkles className="w-16 h-16 text-primary-100" />}
      title={t("FavoritesPage.HeroSection.title")}
      description={t("FavoritesPage.HeroSection.subtitle")}
      tags={[
        t("FavoritesPage.HeroSection.tags.streamNow"),
        t("FavoritesPage.HeroSection.tags.topPicks"),
        t("FavoritesPage.HeroSection.tags.curatedForYou"),
      ]}
      movies={movies}
      isLoading={isLoading}
      emptyIcon={<Sparkles className="w-18 h-18 text-primary-100 opacity-50" />}
      emptyTitle={t("FavoritesPage.emptyTitle")}
      emptySubtitle={t("FavoritesPage.emptySubtitle")}
      containerClassName="flex flex-col items-center relative"
      contentClassName="relative z-10"
    />
  );
}
