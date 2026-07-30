import { useEffect } from "react";
import { useTrailerOverlay } from "@/stores/OverlayStore";

const TrailerModal = () => {
  const { open, closeTrailer, src } = useTrailerOverlay();
  // Close on ESC key (effect must not be conditional on open)
  useEffect(() => {
    if (!open) return; // do nothing when closed
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTrailer();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeTrailer, open]);

  if (!open) return null;

  // format source to get /embed/VIDEO_ID if it's a youtube link
  let transformedSrc = src;
  if (transformedSrc && transformedSrc.includes("youtube.com/watch")) {
    const url = new URL(transformedSrc);
    const videoId = url.searchParams.get("v");
    if (videoId) {
      transformedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&showinfo=0&rel=0`;
    }
  } else if (transformedSrc && transformedSrc.includes("youtu.be/")) {
    const videoId = transformedSrc.split("youtu.be/")[1].split("?")[0];
    transformedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&showinfo=0&rel=0`;
  }

  const videoSrc =
    transformedSrc ||
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-999 flex items-center justify-center pointer-events-none"
    >
      <div className="relative w-[92vw] max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-xl pointer-events-auto">
        <button
          aria-label="Close"
          onClick={closeTrailer}
          className="absolute -top-10 right-0 md:top-4 md:right-4 z-30 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center text-white"
        >
          ✕
        </button>
        <iframe
          title="Trailer"
          src={videoSrc}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default TrailerModal;
