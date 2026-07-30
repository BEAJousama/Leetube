import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, type ElementType, useMemo } from "react";
import type { VariantProps } from "tailwind-variants";
import { tv } from "tailwind-variants";

const ButtonTv = tv({
  slots: {
    container:
      "cursor-pointer flex font-bold rounded-full w-full text-xs hover:shadow-md transition-all duration-300 ease-in-out  items-center justify-center gap-2  bg-primary-100 p-4   text-white",
    label: "block",
    icon: "h-5 w-5",
  },
  variants: {
    isIcon: {
      true: { label: "hidden sm:block" },
      false: { label: "block" },
    },
    variant: {
      Primary: {
        container: "bg-primary-100  hover:shadow-primary-100/30",
      },
      Secondary: {
        container: "bg-secondary-100  hover:shadow-secondary-100/30",
      },
      Destructive: {
        container: "bg-red-500 hover:shadow-red-500/30",
      },
      Outline: {
        container:
          "border border-secondary-100  text-secondary-100  hover:bg--secondary-100  hover:text-white",
      },
      White: {
        container: "bg-white border-none text-black",
      },
    },
    disabled: {
      true: { container: "cursor-not-allowed hover:shadow-none opacity-50" },
    },
    size: {
      sm: { container: "h-8  sm:text-xs", icon: "h-3 w-3" },
      lg: { container: "h-12 sm:text-base", icon: "h-6 w-6" },
      xl: { container: "h-16 sm:text-lg", icon: "h-8 w-8" },
      md: {
        container: "h-10 sm:text-sm",
        icon: "h-4 w-4",
      },
    },
  },
  defaultVariants: {
    isIcon: true,
    disabled: false,
    variant: "Primary",
    size: "sm",
  },
});

type ButtonVariants = VariantProps<typeof ButtonTv>;

interface ButtonProps
  extends ButtonVariants,
    ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ElementType;
  isLoading?: boolean;
  label: string;
  isIcon?: boolean;
}

export const Button = ({
  label,
  isLoading,
  variant = "Destructive",
  icon: BtnIcon,
  className = "",
  disabled,
  size = "md",
  isIcon,
  ...rest
}: ButtonProps) => {
  const styles = useMemo(
    () =>
      ButtonTv({
        variant,
        disabled: disabled || isLoading,
        size,
        isIcon: isIcon !== false && !!BtnIcon,
      }),
    [variant, disabled, size, BtnIcon, isLoading, isIcon],
  );

  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      className={styles.container({ className })}
    >
      {isLoading ? (
        <Loader2
          height={20}
          width={20}
          className="animate-spin text-success-100"
        />
      ) : (
        <>
          {BtnIcon && (
            <div className={styles.icon()}>
              {<BtnIcon height="100%" width="100%" />}
            </div>
          )}
          <span className={styles.label()}>{label}</span>
        </>
      )}
    </button>
  );
};
