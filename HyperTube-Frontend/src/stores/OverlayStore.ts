import { create } from "zustand";

interface OverlayState {
  // Sidebar
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // Trailer Modal
  isTrailerOpen: boolean;
  trailerSrc: string | null;
  openTrailer: (src: string | null) => void;
  closeTrailer: () => void;

  // Confirmation Modal
  isConfirmationOpen: boolean;
  openConfirmation: () => void;
  closeConfirmation: () => void;

  // Helpers
  closeTopOverlay: () => void;

  // Generic overlay states can be added here in future
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
  // Sidebar
  isSidebarOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),

  // Trailer Modal
  isTrailerOpen: false,
  trailerSrc: null,
  openTrailer: (src: string | null) =>
    set({ isTrailerOpen: true, trailerSrc: src ?? null }),
  closeTrailer: () => set({ isTrailerOpen: false, trailerSrc: null }),

  // Confirmation Modal
  isConfirmationOpen: false,
  openConfirmation: () => set({ isConfirmationOpen: true }),
  closeConfirmation: () => set({ isConfirmationOpen: false }),

  // If trailer open close it, else close sidebar
  closeTopOverlay: () => {
    const state = get();
    if (state.isTrailerOpen) {
      set({ isTrailerOpen: false, trailerSrc: null });
    } else if (state.isSidebarOpen) {
      set({ isSidebarOpen: false });
    } else if (state.isConfirmationOpen) {
      set({ isConfirmationOpen: false });
    }
  },
}));

// Convenience hooks (optional for semantic clarity)
export const useSidebarOverlay = () => {
  const { isSidebarOpen, openSidebar, closeSidebar, toggleSidebar } =
    useOverlayStore();
  return { isOpen: isSidebarOpen, openSidebar, closeSidebar, toggleSidebar };
};

export const useTrailerOverlay = () => {
  const { isTrailerOpen, trailerSrc, openTrailer, closeTrailer } =
    useOverlayStore();
  return {
    open: isTrailerOpen,
    src: trailerSrc,
    openTrailer,
    closeTrailer,
  };
};

export const useConfirmationOverlay = () => {
  const { isConfirmationOpen, openConfirmation, closeConfirmation } =
    useOverlayStore();
  return {
    isConfirmationOpen,
    openConfirmation,
    closeConfirmation,
  };
};
