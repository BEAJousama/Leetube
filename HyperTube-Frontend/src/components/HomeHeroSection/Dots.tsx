import React from "react";

type Props = {
  count: number;
  active: number;
  onSelect: (i: number) => void;
};

function Dots({ count, active, onSelect }: Props) {
  return (
    <div className="absolute top-10 right-10 z-40 flex gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onSelect(i)}
          className={`w-3 h-3 rounded-full transition-colors border border-white-100/50 cursor-pointer ${
            i === active ? "bg-primary-100" : "bg-primary-100/30"
          }`}
        />
      ))}
    </div>
  );
}

export default React.memo(Dots);
