import { Star } from "lucide-react";
import React, { useState, useEffect } from "react";

interface StarRatingProps {
  value: number | undefined;
  max?: number;
  onChange?: (value: number) => void;
  onClear?: () => void;
  size?: number;
  disabled?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  max = 5,
  onChange,
  onClear,
  size = 24,
  disabled = false,
  className,
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [internal, setInternal] = useState<number | undefined>(value);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  const handleClick = (idx: number) => {
    if (disabled) return;
    const newVal = idx + 1;
    setInternal(newVal);
    onChange?.(newVal);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setInternal(undefined);
    onClear?.();
  };

  return (
    <div className={"flex items-center gap-1 " + (className || "")}>
      {Array.from({ length: max }).map((_, i) => {
        const active = (hovered ?? internal ?? 0) > i;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Rate ${i + 1}`}
            onMouseEnter={() => setHovered(i + 1)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleClick(i)}
            className="p-0.5"
            disabled={disabled}
          >
            <Star
              className={`transition-colors ${
                active ? "fill-primary-100 text-primary-100" : "text-white/25"
              }`}
              style={{ width: size, height: size }}
            />
          </button>
        );
      })}
      {internal && !disabled && (
        <button
          onClick={handleClear}
          className="text-xs text-white/60 hover:text-white/90 ml-1 underline"
        >
          Clear
        </button>
      )}
    </div>
  );
};
