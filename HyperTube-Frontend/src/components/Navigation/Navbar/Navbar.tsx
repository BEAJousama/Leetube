import { Menu } from "lucide-react";
import { useState } from "react";
import useNavbar from "@/hooks/UseNavbar";
import SortMenu from "./SearchFilterButton";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";
import LanguageSelector from "./LanguageSelector";

interface InnerNavbarProps {
  isSearchExpanded: boolean;
}

const InnerNavbar = ({ isSearchExpanded }: InnerNavbarProps) => {
  return (
    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
      {/* Show on sm+ or xs when search is not expanded */}
      <div className={`${isSearchExpanded ? "hidden" : "xs:block"} sm:block`}>
        <LanguageSelector />
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
  const { toggleSidebar } = useNavbar();

  return (
    <nav className="w-full px-5 py-3 backdrop-blur-xs border-b border-white/5 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        {!isSearchExpanded && (
          <div className="flex items-center gap-2">
            {/* Logo acts as SidebarToggle on Mobile */}
            <div 
              className="lg:hidden flex items-center gap-2 mr-2 cursor-pointer group" 
              onClick={toggleSidebar}
              title="Toggle Menu"
            >
              <span className="relative w-9 h-9 bg-gradient-to-br from-primary-100/30 to-primary-100/5 border border-primary-100/50 rounded-lg flex items-center justify-center group-hover:bg-primary-100/40 transition-colors">
                <img src="/favicon.ico" alt="Logo" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-background-100 rounded-full flex items-center justify-center border border-white/10 shadow-lg">
                  <Menu className="w-3 h-3 text-white/90" />
                </div>
              </span>
              <span className="text-white/80 text-xl font-semibold hidden xs:block group-hover:text-white transition-colors">LeeTube</span>
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
