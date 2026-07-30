import { cloneElement, isValidElement } from "react";
import clsx from "clsx";

interface InfoBannerProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  tags?: string[];
  className?: string;
}

const InfoBanner = ({
  icon,
  title,
  description,
  tags = [],
  className = "",
}: InfoBannerProps) => {
  return (
    <section
      className={`w-full mx-auto mb-10 py-10 px-6 rounded-3xl bg-gradient-to-r from-primary-100/20 via-secondary-100/10 to-background-100/60 shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden ${className}`}
    >
      {/* Shallow background icon centered in the main container */}
      {icon && isValidElement(icon) && (
        <span className="absolute inset-0 flex items-center justify-center z-0">
          {cloneElement(
            icon as any,
            {
              className: clsx(
                "w-40 h-40 opacity-15 blur-[1px] text-primary-100",
                (icon as any)?.props?.className,
              ),
            } as any,
          )}
        </span>
      )}

      {/* Decorative icon (foreground) */}
      {icon && (
        <div className="flex-shrink-0 relative z-10">
          <div className="relative bg-primary-100/30 rounded-full p-6 shadow-lg animate-float overflow-visible">
            <span className="relative z-10">{icon}</span>
          </div>
        </div>
      )}

      <div className="flex-1 relative z-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
          {title}
        </h2>
        <p className="text-lg text-white/80 mb-2">{description}</p>
        {tags.length > 0 && (
          <div className="mt-5">
            <ul className="flex flex-wrap items-center gap-2" aria-label="Tags">
              {tags.map((tag, idx) => {
                const base =
                  "px-3 py-1 rounded-full text-xs font-medium tracking-tight border backdrop-blur-sm select-none transition-colors";
                const variant =
                  idx === 0
                    ? "bg-primary-100/15 text-primary-100 border-primary-100/30"
                    : idx === 1
                      ? "bg-secondary-100/15 text-secondary-100 border-secondary-100/30"
                      : "bg-white/19 text-white/80 border-white/20";
                return (
                  <li key={idx} className={`${base} ${variant}`}>
                    #{tag}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      {/* Decorative background shapes */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-100/10 rounded-full blur-2xl z-0" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary-100/10 rounded-full blur-2xl z-0" />
    </section>
  );
};

export default InfoBanner;
