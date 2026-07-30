import { LogOut } from "lucide-react";
import { useState } from "react";
import useNavbar from "@/hooks/UseNavbar";
import SidebarToggle from "./SidebarToggle";
import SortMenu from "./SearchFilterButton";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";
import LanguageSelector from "./LanguageSelector";

interface InnerNavbarProps {
  isSearchExpanded: boolean;
}

const InnerNavbar = ({ isSearchExpanded }: InnerNavbarProps) => {
  const { onLogout } = useNavbar();
  return (
    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
      {/* Show on sm+ or xs when search is not expanded */}
      <div className={`${isSearchExpanded ? "hidden" : "xs:block"} sm:block`}>
        <LanguageSelector />
      </div>
      {/* Show on sm+ or xs when search is not expanded */}
      <div className={`${isSearchExpanded ? "hidden" : "xs:block"} sm:block`}>
        <button
          className="bg-white/5 backdrop-blur-sm rounded-xl p-3 transition-all duration-200 hover:bg-white/10 border border-white/10 cursor-pointer"
          onClick={onLogout}
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 text-gray-300 hover:text-white" />
        </button>
      </div>
      {/* Show on sm+ or xs when search is not expanded */}
      <div className={`${isSearchExpanded ? "hidden" : "xs:block"} sm:block`}>
        <ProfileMenu />
      </div>
    </div>
  );
};

const NavigationBar = () => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <nav className="w-full px-5 py-3 backdrop-blur-xs border-b border-white/5 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        {!isSearchExpanded && (
          <div className="flex items-center gap-2">
            <SidebarToggle />
            {/* Show logo on mobile when sidebar is hidden */}
            <div className="lg:hidden flex items-center gap-2 mr-2 cursor-pointer" onClick={() => window.location.href = '/'}>
              <span className="w-8 h-8 bg-gradient-to-br from-primary-100/30 to-primary-100/5 border border-primary-100/50 rounded-lg flex items-center justify-center">
                <img src="/favicon.ico" alt="Logo" className="w-5 h-5" />
              </span>
              <span className="text-white/80 text-xl font-semibold hidden xs:block">LeeTube</span>
            </div>
          </div>
        )}
        <SortMenu />
        <SearchBar onExpandChange={setIsSearchExpanded} />
        <InnerNavbar isSearchExpanded={isSearchExpanded} />
      </div>
    </nav>
  );
};

export default NavigationBar;
