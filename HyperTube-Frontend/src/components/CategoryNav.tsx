import { useState, useEffect } from "react";
import { ArrowUpDown, ChevronDown, Check, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SORT_OPTIONS } from "@/types/constants/SearchFilters";

const CategoryNav = ({
  categories,
  selectedCategory,
  onSelect,
  selectedSort = SORT_OPTIONS.POPULARITY,
  onSortChange,
}: {
  categories: string[];
  selectedCategory: string;
  onSelect: (c: string) => void;
  selectedSort?: string;
  onSortChange?: (sort: string) => void;
}) => {
  const { t } = useTranslation();
  const [sortOpen, setSortOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const [maxVisibleCategories, setMaxVisibleCategories] = useState<number>(8);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const value =
        w >= 1800
          ? 14
          : w >= 1600
            ? 10
            : w >= 1280
              ? 8
              : w >= 1024
                ? 4
                : w >= 900
                  ? 5
                  : w >= 700
                    ? 4
                    : w >= 500
                      ? 3
                      : 1;
      setMaxVisibleCategories(value);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const visibleCategories = categories.slice(0, maxVisibleCategories);
  const hiddenCategories = categories.slice(maxVisibleCategories);

  const sortOptions = [
    {
      key: SORT_OPTIONS.POPULARITY,
      label: t("CategoryNav.sortOptions.popularity") || "Popularity",
    },
    {
      key: SORT_OPTIONS.RATING,
      label: t("CategoryNav.sortOptions.rating") || "Rating",
    },
    {
      key: SORT_OPTIONS.TITLE,
      label: t("CategoryNav.sortOptions.title") || "Title",
    },
    {
      key: SORT_OPTIONS.YEAR,
      label: t("CategoryNav.sortOptions.year") || "Year",
    },
  ];

  const currentSortLabel =
    sortOptions.find((opt) => opt.key === selectedSort)?.label || "Latest";

  const onToggleSort = () => setSortOpen((v) => !v);
  const onToggleMore = () => setMoreOpen((v) => !v);

  const onSelectSort = (key: string) => {
    onSortChange?.(key);
    setSortOpen(false);
  };

  const onSelectCategory = (category: string) => {
    onSelect(category);
    setMoreOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest(
          'button[aria-haspopup="menu"], div[role="menu"]',
        )
      ) {
        setSortOpen(false);
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="flex gap-2 flex-row flex-wrap items-center">
      {/* Sort By Dropdown */}
      <div className="flex-shrink-0 relative">
        <button
          onClick={onToggleSort}
          className="flex items-center md:gap-2 py-3.5 px-1.5 md:px-3 md:py-2.5 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 border border-white/10 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
          aria-haspopup="menu"
          aria-expanded={sortOpen}
          aria-label="Sort by"
        >
          <ArrowUpDown className="w-4 h-4 text-white/70" />
          <span className="hidden md:inline text-white font-light text-sm md:text-base">
            {t("CategoryNav.sortBy") || "Sort by"}
          </span>
          <span className="hidden xl:inline text-white/70 text-xs md:text-sm">
            {currentSortLabel}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-white/70 transition-transform ${sortOpen ? "rotate-180" : ""}`}
          />
        </button>

        {sortOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full mt-2 w-56 md:w-64 rounded-2xl border border-white/10 bg-[#252a34]/80 backdrop-blur-md shadow-2xl p-2 z-[999] ring-1 ring-white/10"
          >
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/60">
              {t("CategoryNav.sortBy") || "Sort by"}
            </div>
            <ul className="max-h-64 overflow-auto no-scrollbar">
              {sortOptions.map((opt) => {
                const active = opt.key === selectedSort;
                return (
                  <li key={opt.key}>
                    <button
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => onSelectSort(opt.key)}
                      className={`w-full flex items-center gap-1 sm:gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 ${
                        active
                          ? "bg-primary-100/20 text-white border border-primary-100/30"
                          : "text-gray-300 hover:text-white hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center w-5 h-5 rounded-md ${active ? "bg-primary-100/80" : "bg-white/10"}`}
                      >
                        {active ? (
                          <Check className="w-3.5 h-3.5 text-black" />
                        ) : null}
                      </span>
                      <span className="flex-1 text-left text-sm md:text-[15px]">
                        {opt.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Visible Categories */}
      {visibleCategories.map((category) => (
        <button
          key={category}
          aria-pressed={selectedCategory === category}
          onClick={() => onSelect(category)}
          className={`shrink-0 px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
            selectedCategory === category
              ? "bg-primary-100 text-gray-900/80 font-medium"
              : "bg-white/15 backdrop-blur-sm text-gray-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          {category}
        </button>
      ))}

      {/* More Categories Dropdown */}
      {hiddenCategories.length > 0 && (
        <div className="flex-shrink-0 relative">
          <button
            onClick={onToggleMore}
            className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full hover:bg-white/20 border border-white/10 transition-all duration-200 cursor-pointer text-gray-300 hover:text-white"
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-label="More categories"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-sm">{t("CategoryNav.more") || "More"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${moreOpen ? "rotate-180" : ""}`}
            />
          </button>

          {moreOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-[#252a34]/80 backdrop-blur-md shadow-2xl p-2 z-[999] ring-1 ring-white/10"
            >
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/60">
                {t("CategoryNav.moreCategories") || "More Categories"}
              </div>
              <ul className="max-h-64 overflow-auto no-scrollbar space-y-1">
                {hiddenCategories.map((category) => {
                  const active = category === selectedCategory;
                  return (
                    <li key={category}>
                      <button
                        onClick={() => onSelectCategory(category)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 ${
                          active
                            ? "bg-primary-100/20 text-white border border-primary-100/30"
                            : "text-gray-300 hover:text-white hover:bg-white/10 border border-transparent"
                        }`}
                      >
                        <span
                          className={`flex items-center justify-center w-5 h-5 rounded-md ${active ? "bg-primary-100/80" : "bg-white/10"}`}
                        >
                          {active ? (
                            <Check className="w-3.5 h-3.5 text-black" />
                          ) : null}
                        </span>
                        <span className="flex-1 text-left text-sm md:text-[15px]">
                          {category}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default CategoryNav;
