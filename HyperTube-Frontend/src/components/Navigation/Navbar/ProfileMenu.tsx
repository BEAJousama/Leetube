import { ChevronDown, LogOut } from "lucide-react";
import useNavbar from "@/hooks/UseNavbar";
import { useTranslation } from "react-i18next";

export default function ProfileMenu() {
  const {
    displayName,
    initials,
    user,
    profileOpen: open,
    profileRef,
    toggleProfile: onToggle,
    goToProfile: onGoProfile,
    goToSettings: onGoSettings,
    onLogout,
  } = useNavbar();
  const { t } = useTranslation();

  return (
    <div ref={profileRef} className="relative">
      <button
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 cursor-pointer group bg-white/5 backdrop-blur-sm rounded-xl p-2 transition-all duration-200 border border-white/10"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100/70 to-primary-100/20 flex items-center justify-center overflow-hidden">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={displayName}
              className="w-8 h-8 object-cover rounded-lg"
            />
          ) : (
            <span className="text-white text-sm font-medium">{initials}</span>
          )}
        </div>
        <div className="hidden lg:flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-white/80 font-normal font-sans text-sm">
              {displayName}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-white/70 group-hover:text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-white/10 bg-[#252a34]/80 backdrop-blur-md shadow-2xl p-2 z-[999] ring-1 ring-white/10"
        >
          <ul className="py-1">
            <li>
              <button
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/10"
                onClick={onGoProfile}
              >
                {t("NavBar.profile")}
              </button>
            </li>
            <li>
              <button
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/10"
                onClick={onGoSettings}
              >
                {t("NavBar.settings")}
              </button>
            </li>
            <li>
              <hr className="border-white/10 my-1 mx-2" />
            </li>
            <li>
              <button
                className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4" />
                {t("NavBar.logout") || "Logout"}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
