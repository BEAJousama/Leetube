import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { AppRoutes } from "@/api/Routes";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { SEARCH_FILTERS } from "@/types/constants/SearchFilters";

export default function SortMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFieldParam = searchParams.get("by") || SEARCH_FILTERS.TITLE;
  const [searchKey, setSearchKey] = useState(
    currentFieldParam || SEARCH_FILTERS.TITLE,
  );
  const searchOptions = [
    { key: SEARCH_FILTERS.TITLE, label: t("NavBar.SearchOptions.byTitle") },
    { key: SEARCH_FILTERS.YEAR, label: t("NavBar.SearchOptions.byYear") },
    { key: SEARCH_FILTERS.CAST, label: t("NavBar.SearchOptions.byCast") },
  ];
  const currentLabel =
    searchOptions.find((opt) => opt.key === searchKey)?.label || "";

  const onToggle = () => setOpen((v) => !v);
  const onSelect = (key: string) => {
    setSearchKey(key);
    const q = searchParams.get("q");
    const next = new URLSearchParams(searchParams);
    next.set("by", key);
    // Always reflect chosen field in URL params (without forcing navigation if no q yet)
    setSearchParams(next, { replace: true });
    if (q && !pathname.startsWith(AppRoutes.SEARCH)) {
      navigate(`${AppRoutes.SEARCH}?${next.toString()}`);
    }
    setOpen(false);
  };

  // Sync internal state if URL param changes externally
  useEffect(() => {
    if (currentFieldParam !== searchKey) {
      setSearchKey(currentFieldParam);
    }
  }, [currentFieldParam, searchKey]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest(
          'button[aria-haspopup="menu"], div[role="menu"]',
        )
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="flex-shrink-0 relative">
      <button
        onClick={onToggle}
        className="flex items-center md:gap-2 py-3.5 px-1.5 md:px-3 md:py-2.5 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 border border-white/10 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Search by"
      >
        <ArrowUpDown className="w-4 h-4 text-white/70" />
        <span className="hidden md:inline text-white font-light text-sm md:text-base">
          {t("NavBar.searchBy")}
        </span>
        <span className="hidden xl:inline text-white/70 text-xs md:text-sm">
          {currentLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/70 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 w-56 md:w-64 rounded-2xl border border-white/10 bg-[#252a34]/80 backdrop-blur-md shadow-2xl p-2 z-[999] ring-1 ring-white/10"
        >
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/60">
            {t("NavBar.searchBy")}
          </div>
          <ul className="max-h-64 overflow-auto no-scrollbar">
            {searchOptions.map((opt) => {
              const active = opt.key === searchKey;
              return (
                <li key={opt.key}>
                  <button
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => onSelect(opt.key)}
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
  );
}
