import MoviesPage from "@/components/MoviesPage";
import { BookOpen } from "lucide-react";
import { useLibraryMovies } from "@/hooks/UseMoviesQuery";
import { useTranslation } from "react-i18next";

export default function LibraryPage() {
  const { data: movies = [], isLoading } = useLibraryMovies();
  const { t } = useTranslation();

  return (
    <MoviesPage
      icon={<BookOpen className="w-16 h-16 text-primary-100" />}
      title={t("LibraryPage.title")}
      description={t("LibraryPage.HeroSection.subtitle")}
      tags={[
        t("LibraryPage.HeroSection.tags.myCollection"),
        t("LibraryPage.HeroSection.tags.watchAnytime"),
        t("LibraryPage.HeroSection.tags.organized"),
      ]}
      movies={movies}
      isLoading={isLoading}
      emptyIcon={<BookOpen className="w-18 h-18 text-primary-100 opacity-50" />}
      emptyTitle={t("LibraryPage.emptyTitle")}
      emptySubtitle={t("LibraryPage.emptySubtitle")}
    />
  );
}
