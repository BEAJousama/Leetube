import { type Movie } from "@/types/Movie";
import { useTranslation } from "react-i18next";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebarOverlay } from "@/stores/OverlayStore";

const SidebarContinueWatching = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { closeSidebar } = useSidebarOverlay();

  const [continueWatchingItems, setContinueWatchingItems] = useState<Movie[]>(
    [],
  );

  useEffect(() => {
    // mock fetching continue watching items, replace with real API call
    setContinueWatchingItems([
      {
        id: "123456",
        title: "Inception",
        progress: 45,
        releaseYear: 2010,
        rating: 8.532,
        poster: "/poster-placeholder.png",
      },
    ]);
  }, []);

  if (!continueWatchingItems.length) return null;

  return (
    <div className="flex-1 overflow-hidden border-t border-white/5 pt-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Play className="w-4 h-4" />
        {t("ContinueWatching")}
      </h3>
      <div className="no-scrollbar space-y-3 overflow-x-auto scrollbar-thin scrollbar-thumb-cyan-200 scrollbar-track-transparent h-[calc(100%-2rem)]">
        {continueWatchingItems.map((item, index) => (
          <div
            key={index}
            className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-800 hover:bg-gray-750 transition-colors duration-200"
            onClick={() => {
              closeSidebar();
              navigate(`/movie/${item.id}`);
            }}
          >
            {/* Background Image with Overlay */}
            <div className="relative h-24 overflow-hidden">
              <img
                src={item.poster}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/10 to-secondary-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out backdrop-blur-[2px] rounded-xl" />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative z-10 w-10 h-10 bg-secondary-100/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border-2 border-primary-100 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-in-out">
                  <Play className="w-4 h-4 text-white fill-primary-100/90" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="z-0 w-10 h-10 rounded-full border-2 border-secondary-100/70 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300" />
                </div>
              </div>
            </div>
            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <h4 className="text-white font-medium text-sm mb-1 truncate">
                {item.title}
              </h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">
                  {item.runtime
                    ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}min`
                    : item.releaseYear}
                </span>
                <span className="text-gray-300">
                  {item.rating
                    ? `${parseFloat(item.rating.toString()).toFixed(1)}/10`
                    : null}
                </span>
                <span className="text-gray-300">
                  {item.progress ? `${item.progress}%` : null}
                </span>
              </div>
              {/* Progress Bar */}
              {item.progress ? (
                <div className="w-full bg-gray-700/50 rounded-full h-1 mt-2">
                  <div
                    className="bg-cyan-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarContinueWatching;
