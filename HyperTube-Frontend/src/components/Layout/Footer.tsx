import { memo } from "react";

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 text-[11px] sm:text-xs text-white/60 py-3 px-4 bg-background-100/40 backdrop-blur-xs">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-3">
        <span>© {year} LeeTube</span>
        <span className="hidden sm:inline">All rights reserved.</span>
      </div>
    </footer>
  );
}

export default memo(Footer);
