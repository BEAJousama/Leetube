import React from "react";
import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  title: string;
  duration?: string; // e.g., "2.3 min"
  onPlay: () => void;
};

function TitlePlay({ title, duration, onPlay }: Props) {
  const { t } = useTranslation();

  return (
    <div className="absolute bottom-6 left-6 z-50">
      <h1 className="text-white text-3xl sm:text-4xl font-semibold mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
        {title}
      </h1>
      <button
        onClick={onPlay}
        className="text-white flex items-center gap-2 bg-white/20 backdrop-blur-md p-2 sm:p-3 rounded-full hover:bg-white/30 transition-colors cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center">
          <Play className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm sm:text-base">{t("playTrailer")}</span>
        {duration ? (
          <span className="hidden sm:block text-sm opacity-80">{duration}</span>
        ) : null}
      </button>
    </div>
  );
}

export default React.memo(TitlePlay);
