import type { ReactNode } from "react";

type SeparatorProps = {
  label?: ReactNode;
};

export function Separator({ label = "OR" }: SeparatorProps) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 my-4 sm:my-6">
      <div className="flex-1 h-px bg-white/20"></div>
      {label && (
        <span className="text-white/60 text-xs sm:text-sm font-medium">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-white/20"></div>
    </div>
  );
}

export default Separator;
