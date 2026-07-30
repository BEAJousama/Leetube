import React from "react";
import { Heart } from "lucide-react";

type Props = {
  onClick?: () => void;
  ariaLabel?: string;
  inFavorite?: boolean;
  isLoading?: boolean;
};

function HeartButton({
  onClick,
  ariaLabel = "Add to favorites",
  inFavorite,
  isLoading = false,
}: Props) {
  return (
    <div className="text-secondary-100 absolute bottom-6 right-6 z-50 cursor-pointer duration-300 transition-all hover:scale-105 group">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className="w-11 h-11 cursor-pointer bg-black/30 backdrop-blur-md rounded-xl border border-secondary-100/50 flex items-center justify-center hover:bg-black/50 transition-colors hover:shadow-sm hover:shadow-secondary-100/50"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-t-2 border-secondary-100 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Heart
            className={`w-5 h-5 ${inFavorite ? "fill-secondary-100" : "group-hover:fill-secondary-100/40"}`}
          />
        )}
      </button>
    </div>
  );
}

export default React.memo(HeartButton);
