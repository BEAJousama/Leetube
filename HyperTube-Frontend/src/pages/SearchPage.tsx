import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MoviesGrid from "@/components/MoviesGrid";
import { AppRoutes } from "@/api/Routes";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SEARCH_FILTERS } from "@/types/constants/SearchFilters";
import { useInfiniteSearchMovies } from "@/hooks/UseMoviesQuery";

export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = (params.get("q") || "").trim();
  const by = params.get("by") || SEARCH_FILTERS.TITLE;
  const { t } = useTranslation();

  useEffect(() => {
    if (!q) navigate(AppRoutes.HOME, { replace: true });
  }, [q, navigate]);

  // Map search filter to API search type
  const getSearchType = (filterType: string): "title" | "year" | "cast" => {
    switch (filterType) {
      case SEARCH_FILTERS.YEAR:
        return "year";
      case SEARCH_FILTERS.CAST:
        return "cast";
      case SEARCH_FILTERS.TITLE:
      default:
        return "title";
    }
  };

  const searchType = getSearchType(by);

  // Validate year input: must be numeric when searching by year
  const isYearSearch = searchType === "year";
  const isValidYearInput = !isYearSearch || /^\d{4}$/.test(q);
  const queryForHook = isValidYearInput ? q : ""; // disable query when invalid

  // Use infinite search hook for pagination
  const {
    data,
    isLoading,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteSearchMovies(searchType, queryForHook, 20);

  // Flatten all pages into a single array of movies
  const movies = data?.pages?.flatMap((page) => page.movies || []) || [];

  // Intersection Observer ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Set up Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isLoading
        ) {
          fetchNextPage();
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of sentinel is visible
        rootMargin: "100px", // Start loading 100px before sentinel is visible
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  return (
    <div className="p-6 min-h-screen w-full flex flex-col gap-8 pb-16">
      <div className="flex flex-col gap-4 items-center text-center">
        <div className="flex items-center gap-3">
          <Search className="w-8 h-8 text-primary-100" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {t("SearchPage.title", { query: q })}
          </h1>
        </div>
        <p className="text-white/60 max-w-2xl">
          {t("SearchPage.subtitle")} •
          <br />
          Searching by {searchType}
        </p>
        {isYearSearch && !isValidYearInput && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2 mt-2">
            {t("SearchPage.invalidYear", "Year must be 4 digits (e.g., 1999)")}
          </div>
        )}
        {movies.length > 0 && (
          <p className="text-white/40 text-sm">
            Found {movies.length} movie{movies.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Search className="w-10 h-10 text-red-400 mb-6" />
          <p className="text-2xl font-semibold text-red-400 mb-2">
            Search Error
          </p>
          <p className="text-white/50 max-w-md">
            {error?.message ||
              "An error occurred while searching. Please try again."}
          </p>
        </div>
      )}

      {/* No results state */}
      {!isLoading && !isError && movies.length === 0 && q && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Search className="w-10 h-10 text-secondary-100 mb-6 animate-pulse" />
          <p className="text-2xl font-semibold text-white/80 mb-2">
            {t("SearchPage.noResults")}
          </p>
          <p className="text-white/50 max-w-md">
            {t("SearchPage.noResultsMsg")}
          </p>
          <p className="text-sm text-white/30 max-w-md">
            {t("SearchPage.tryDifferent")}
          </p>
        </div>
      )}

      {/* Results with infinite scroll */}
      {(movies.length > 0 || isLoading) && (
        <>
          <MoviesGrid
            movies={movies}
            loading={isLoading && movies.length === 0}
            sentinelRef={hasNextPage ? sentinelRef : undefined}
          />

          {/* Load more indicator */}
          {isFetchingNextPage && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
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
          )}

          {/* End of results indicator */}
          {!hasNextPage && movies.length > 0 && !isLoading && (
            <div className="flex justify-center items-center py-8">
              <p className="text-white/50 text-sm">
                🎬 You've reached the end of the search results
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
