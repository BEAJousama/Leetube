import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  USFlag,
  FranceFlag,
  SpainFlag,
  GermanyFlag,
} from "@/components/icons/FlagIcons";
import { useAuth } from "@/stores/AuthStore";

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profile = useAuth().user;
  const defaultLanguage = profile?.preferredLanguage || "en";

  const languages = [
    {
      code: "en",
      name: t("NavBar.languages.en"),
      flag: USFlag,
    },
    {
      code: "fr",
      name: t("NavBar.languages.fr"),
      flag: FranceFlag,
    },
    {
      code: "es",
      name: t("NavBar.languages.es"),
      flag: SpainFlag,
    },
    {
      code: "de",
      name: t("NavBar.languages.de"),
      flag: GermanyFlag,
    },
  ];

  // Initialize i18n with user's preferred language when profile loads
  useEffect(() => {
    if (profile?.preferredLanguage) {
      // Force change language and persist it
      i18n.changeLanguage(profile.preferredLanguage);
      // Also store in localStorage to prevent LanguageDetector from overriding
      localStorage.setItem("i18nextLng", profile.preferredLanguage);
    }
  }, [profile?.preferredLanguage, i18n]);

  // Handle initial load case - run once when component mounts and profile is available
  useEffect(() => {
    if (
      profile?.preferredLanguage &&
      i18n.language !== profile.preferredLanguage
    ) {
      i18n.changeLanguage(profile.preferredLanguage);
      localStorage.setItem("i18nextLng", profile.preferredLanguage);
    }
  }, [profile, i18n]);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) ||
    languages.find((lang) => lang.code === defaultLanguage) ||
    languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-1 cursor-pointer group bg-white/5 backdrop-blur-sm rounded-xl py-3 px-1.5 transition-all duration-200 border border-white/10 hover:bg-white/10"
        aria-label={t("NavBar.language")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <currentLanguage.flag className="w-5 h-5" />
        <ChevronDown
          className={`w-4 h-4 text-white/70 group-hover:text-gray-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-white/10 bg-[#252a34]/80 backdrop-blur-md shadow-2xl p-2 z-[999] ring-1 ring-white/10"
        >
          <div className="p-1 text-xs uppercase tracking-wide text-white/60">
            {t("NavBar.language")}
          </div>
          <ul className="py-1">
            {languages.map((language) => {
              const active = currentLanguage.code === language.code;
              const FlagIcon = language.flag;
              return (
                <li key={language.code}>
                  <button
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`w-full flex items-center gap-3 p-2 mb-1 rounded-xl transition-colors duration-200 ${
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
                    <FlagIcon className="w-4 h-4" />
                    <span className="flex-1 text-left text-sm">
                      {language.name}
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
};

export default LanguageSelector;
