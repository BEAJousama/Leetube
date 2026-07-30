import { Home, Heart, TrendingUp, Settings, Film } from "lucide-react";
import { useSidebarOverlay } from "@/stores/OverlayStore";
import { AppRoutes } from "@/api/Routes";
import SidebarNavLinks from "@/components/Navigation/Sidebar/SidebarNavLinks";
import SidebarSettingsLinks from "@/components/Navigation/Sidebar/SidebarSettingsLinks";
// import SidebarContinueWatching from "@/components/Navigation/Sidebar/SidebarContinueWatching";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const { isOpen, closeSidebar } = useSidebarOverlay();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navigationItems = [
    { icon: Home, label: t("SideBar.home"), to: AppRoutes.HOME },
    { icon: Heart, label: t("SideBar.favorites"), to: AppRoutes.FAVORITES },
    { icon: Film, label: t("SideBar.library"), to: AppRoutes.LIBRARY },
    { icon: TrendingUp, label: t("SideBar.trending"), to: AppRoutes.TRENDING },
  ];

  const settingsItems = [
    { icon: Settings, label: t("SideBar.settings"), to: AppRoutes.SETTINGS },
  ];

  return (
    <div
      className={`fixed left-0 top-0 w-64 lg:w-72 md:w-64 sm:w-64 h-screen p-6 flex flex-col z-999 lg:z-99 transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } lg:static backdrop-blur-xs border-r border-white/5 lg:bg-transparent bg-background-100/80`}
    >
      {/* Logo Section */}
      <div
        className="flex items-center gap-3 mb-6 border-b border-white/5 pb-2 cursor-pointer"
        onClick={() => {
          navigate(AppRoutes.HOME);
          closeSidebar();
        }}
      >
        <span className="w-10 h-10 bg-gradient-to-br from-primary-100/30 to-primary-100/5 border border-primary-100/50 rounded-lg flex items-center justify-center">
          <img src="/favicon.ico" alt="Logo" className="w-6 h-6" />
        </span>
        <span className="text-white/80 text-2xl font-semibold">LeeTube</span>
      </div>
      <div className="flex flex-col flex-1 h-full overflow-y-auto overflow-x-hidden">
        <SidebarNavLinks
          navigationItems={navigationItems}
          closeSidebar={closeSidebar}
        />
        
        <div className="mt-auto pt-6 flex flex-col gap-4">
          <SidebarSettingsLinks
            settingsItems={settingsItems}
            closeSidebar={closeSidebar}
          />
          
          {/* Academic Disclaimer */}
          <div className="mx-2 mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] sm:text-xs text-white/50 text-center leading-relaxed shadow-sm">
            <span className="block font-semibold text-white/70 mb-1">1337 / 42 Network</span>
            Academic Project
            <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[10px] text-white/40">
              Not for commercial use.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
