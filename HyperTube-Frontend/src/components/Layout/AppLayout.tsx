import { type ReactNode, useEffect, useState, useRef } from "react";
import { Outlet } from "react-router-dom";
import Overlay from "@/components/Overlay";
import Sidebar from "@/components/Navigation/Sidebar/Sidebar";
import NavigationBar from "@/components/Navigation/Navbar/Navbar";
import {
  useSidebarOverlay,
  useTrailerOverlay,
  useOverlayStore,
  useConfirmationOverlay,
} from "@/stores/OverlayStore";
import ConfirmationPopup from "../ConfirmationPopup";
import ScrollToTop from "@/components/ScrollToTop";

type Props = {
  children?: ReactNode;
};

export default function AppLayout({ children }: Props) {
  const { isOpen } = useSidebarOverlay();
  const { open: trailerOpen } = useTrailerOverlay();
  const { isConfirmationOpen } = useConfirmationOverlay();
  const closeTopOverlay = useOverlayStore((s) => s.closeTopOverlay);
  const openOverlay = isOpen || trailerOpen || isConfirmationOpen;
  const overlayClass =
    !isOpen && (trailerOpen || isConfirmationOpen) ? "z-[998]" : undefined;

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scrollContainer = document.getElementById("app-scroll-container");
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 5000); // 5 seconds after scroll stops
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  return (
    <div className="flex h-screen">
      <ScrollToTop behavior="smooth" targetSelector="#app-scroll-container" />
      {/* Mobile Overlay */}
      <Overlay
        isOpen={openOverlay}
        onClick={closeTopOverlay}
        className={overlayClass}
      />

      {/* Confirmation Popup */}
      <ConfirmationPopup />

      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <NavigationBar />
        <main
          id="app-scroll-container"
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative"
        >
          <div className="flex-1">
            {children ?? <Outlet />}
          </div>
          
          {/* Mobile Permanent Disclaimer */}
          <div 
            className={`lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-[90] bg-black/50 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-medium text-white/70 whitespace-nowrap pointer-events-none shadow-lg transition-all duration-300 ease-in-out ${isScrolling ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}
          >
            1337 / 42 Network Academic Project
          </div>
        </main>
      </div>
    </div>
  );
}
