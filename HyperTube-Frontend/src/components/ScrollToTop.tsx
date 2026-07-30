import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type Props = {
  behavior?: ScrollBehavior;
  /**
   * Optional CSS selector for a scrollable container. If provided,
   * the component will scroll this container instead of the window.
   */
  targetSelector?: string;
};

export default function ScrollToTop({
  behavior = "auto",
  targetSelector,
}: Props) {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Reset scroll position on path change
    if (typeof window === "undefined") return;

    const el = targetSelector
      ? (document.querySelector(targetSelector) as HTMLElement | null)
      : null;

    if (el) {
      try {
        el.scrollTo({ top: 0, left: 0, behavior });
      } catch {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      }
      return;
    }

    try {
      window.scrollTo({ top: 0, left: 0, behavior });
    } catch {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
  }, [pathname, search, hash, behavior, targetSelector]);

  return null;
}
