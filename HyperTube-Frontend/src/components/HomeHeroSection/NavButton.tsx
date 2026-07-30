import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  direction: "prev" | "next";
  onClick: () => void;
};

function NavButton({ direction, onClick }: Props) {
  const isPrev = direction === "prev";
  const common =
    "absolute top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-xl border border-primary-100/50 bg-black/30 hover:bg-black/50 backdrop-blur-md flex items-center justify-center duration-300 transition-all cursor-pointer hover:scale-105 hover:shadow-sm hover:shadow-primary-100/50";
  return (
    <button
      aria-label={isPrev ? "Previous slide" : "Next slide"}
      onClick={onClick}
      className={(isPrev ? "left-3 " : "right-3 ") + common}
    >
      {isPrev ? (
        <ChevronLeft className="w-5 h-5" />
      ) : (
        <ChevronRight className="w-5 h-5" />
      )}
    </button>
  );
}

export default React.memo(NavButton);
