import { type ReactNode } from "react";
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
import Footer from "./Footer";

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
      <div className="flex-1 flex flex-col">
        <NavigationBar />
        <main
          id="app-scroll-container"
          className="flex-1 overflow-y-auto overflow-x-auto"
        >
          {children ?? <Outlet />}
        </main>
        <Footer />
      </div>
    </div>
  );
}
