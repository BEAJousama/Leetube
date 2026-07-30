import React from "react";

type Slide = {
  title: string;
  image: string;
};

type Props = {
  slide: Slide;
  rel: 0 | 1 | 2; // 0=current, 1=next, 2=next-next
  isLoading?: boolean;
};

const getLayerClasses = (rel: 0 | 1 | 2) => {
  switch (rel) {
    case 0:
      return "translate-x-0 scale-100 z-30 opacity-100";
    case 1:
      return "lg:translate-x-[100px] lg:scale-[0.9] xl:translate-x-[120px] xl:scale-[0.92] 2xl:translate-x-[140px] 2xl:scale-[0.94] 3xl:translate-x-[160px] 3xl:scale-[0.95] z-20 opacity-95";
    case 2:
      return "lg:translate-x-[190px] lg:scale-[0.82] xl:translate-x-[230px] xl:scale-[0.84] 2xl:translate-x-[270px] 2xl:scale-[0.86] 3xl:translate-x-[310px] 3xl:scale-[0.88] z-10 opacity-85";
  }
};

function SlideCard({ slide, rel, isLoading = false }: Props) {
  return (
    <div
      className={
        "absolute inset-0 rounded-3xl overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] transition-all duration-500 " +
        (rel === 0 ? "cursor-pointer " : "hidden lg:block ") +
        getLayerClasses(rel)
      }
    >
      {isLoading ? (
        // Loading placeholder with skeleton animation
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
        </div>
      ) : (
        <img
          src={slide.image}
          alt={slide.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== "/poster-placeholder.png") {
              target.src = "/poster-placeholder.png";
            }
          }}
        />
      )}
      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-30" />
    </div>
  );
}

export default React.memo(SlideCard);
