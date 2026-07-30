import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AppRoutes } from "@/api/Routes";
interface SearchBarProps {
  onExpandChange?: (expanded: boolean) => void;
}

export default function SearchBar({ onExpandChange }: SearchBarProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [value, setSearchQuery] = useState(initialQ);
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { pathname } = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const focused = searchFocused || isExpanded;

  const onClear = () => {
    setSearchQuery("");
    if (pathname.startsWith(AppRoutes.SEARCH)) {
      navigate(AppRoutes.HOME, { replace: true });
    }
  };

  const handleSearch = () => {
    const v = value.trim();
    if (v) {
      const by = searchParams.get("by");
      const next: Record<string, string> = { q: v };
      if (by) next.by = by;
      setSearchParams(next);
      if (!pathname.startsWith(AppRoutes.SEARCH)) {
        const qs = new URLSearchParams(next).toString();
        navigate(`${AppRoutes.SEARCH}?${qs}`);
      }
    } else if (pathname.startsWith(AppRoutes.SEARCH)) {
      navigate(AppRoutes.HOME, { replace: true });
    }
  };

  const handleExpandToggle = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    onExpandChange?.(newExpandedState);
    if (newExpandedState) {
      // Auto focus when expanding
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleInputBlur = () => {
    setSearchFocused(false);
    // Collapse on blur only if no search value and on mobile
    if (!value) {
      setIsExpanded(false);
      onExpandChange?.(false);
    }
  };

  return (
    <>
      {/* Mobile search (xs breakpoint) */}
      <div className="xs:block sm:hidden ml-2">
        {!isExpanded ? (
          <button
            onClick={handleExpandToggle}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-3 px-3.5 transition-all duration-200 hover:bg-white/10 border border-white/10 cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-white/70" />
          </button>
        ) : (
          <div className="flex-1">
            <div
              className={`relative flex items-center border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2.5 transition-all duration-200 ${focused ? "ring-2 ring-primary-100/50 ring-opacity-60" : ""}`}
            >
              <button
                onClick={handleSearch}
                className="w-5 h-5 text-white/70 mr-3 flex-shrink-0 hover:text-white transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder={t("NavBar.searchForMovies")}
                className="flex-1 bg-transparent text-white placeholder-gray-400 placeholder:italic outline-none"
                onFocus={() => setSearchFocused(true)}
                onBlur={handleInputBlur}
                value={value}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <button
                aria-label="Close search"
                onClick={handleExpandToggle}
                className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop search bar (sm and up) */}
      <div className="hidden sm:block flex-1 md:max-w-2xl mx-2 md:mx-6">
        <div className="relative">
          <div
            className={`relative flex items-center border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2.5 transition-all duration-200 ${focused ? "ring-2 ring-primary-100/50 ring-opacity-60" : ""}`}
          >
            <button
              onClick={handleSearch}
              className="w-5 h-5 text-white/70 mr-3 flex-shrink-0 hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder={t("NavBar.searchForMovies")}
              className="flex-1 bg-transparent text-white placeholder-gray-400 placeholder:italic outline-none"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              value={value}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            {value && (
              <button
                aria-label="Clear search"
                onClick={onClear}
                className="absolute right-3 text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
