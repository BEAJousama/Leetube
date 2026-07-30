import { memo } from "react";

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 text-[11px] sm:text-xs text-white/60 py-4 px-4 bg-background-100/40 backdrop-blur-xs">
      <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-white/80">© {year} LeeTube</span>
          <span className="text-white/40 text-[10px] sm:text-[11px] max-w-2xl leading-relaxed">
            This application is an academic project developed strictly for educational purposes as part of the <strong>1337 Coding School / 42 Network</strong> curriculum. It is not intended for commercial use. Any media content streamed via torrenting is for demonstration purposes only.
          </span>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
