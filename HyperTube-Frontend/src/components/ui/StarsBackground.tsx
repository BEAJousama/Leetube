import { useStarsBackground } from "@/hooks/UseStartsBakground";
import { memo } from "react";

const StarsBackground = memo(() => {
  useStarsBackground();

  return (
    <>
      <div className="bg-background-100 fixed top-0 left-0 w-full h-full pointer-events-none z-[1] overflow-hidden">
        <div id="stars-bg" className="absolute w-full h-full"></div>

        <div
          className="shooting-star-1 absolute w-0.5 h-0.5 bg-gradient-to-r from-transparent via-[#08D9D6] to-transparent rounded-full"
          style={{ top: "20%", animation: "shoot 8s linear infinite" }}
        ></div>
        <div
          className="shooting-star-2 absolute w-0.5 h-0.5 bg-gradient-to-r from-transparent via-[#FF2E63] to-transparent rounded-full"
          style={{ top: "50%", animation: "shoot 8s linear infinite 3s" }}
        ></div>
        <div
          className="shooting-star-3 absolute w-0.5 h-0.5 bg-gradient-to-r from-transparent via-[#08D9D6] to-transparent rounded-full"
          style={{ top: "80%", animation: "shoot 8s linear infinite 6s" }}
        ></div>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[2]">
        <div id="particles-bg" className="absolute w-full h-full"></div>
      </div>
    </>
  );
});

export default StarsBackground;
