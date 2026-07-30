import {
  DotLottieReact,
  type DotLottieReactProps,
} from "@lottiefiles/dotlottie-react";
import clsx from "clsx";

interface LoadingProps extends DotLottieReactProps {
  className?: string;
}

export const Loading = ({ className, ...rest }: LoadingProps) => {
  return (
    <div
      className={clsx(
        "flex-1 justify-center min-h-screen items-center flex ",
        className,
      )}
    >
      <DotLottieReact
        src="/animation.json"
        loop
        style={{ width: "200px", height: "200px" }}
        autoplay
        {...rest}
      />
    </div>
  );
};
