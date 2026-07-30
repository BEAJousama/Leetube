import React from "react";
import StarsBackground from "../ui/StarsBackground";

const BackgroundLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="font-sans relative min-h-screen">
      <StarsBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default BackgroundLayout;
