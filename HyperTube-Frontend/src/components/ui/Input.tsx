import {
  type InputHTMLAttributes,
  useCallback,
  useMemo,
  useState,
} from "react";
import { tv, type VariantProps } from "tailwind-variants";

import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

const InputTv = tv({
  slots: {
    container: "flex w-full items-start flex-col gap-1",
    label: "text-sm font-medium text-[#EAEAEA]/80",
    input:
      "w-full rounded-lg transition-all duration-300 ease-in-out focus:outline-none pr-2 pl-6 font-normal bg-white/5 border border-white/20 text-[#EAEAEA] placeholder:text-[#EAEAEA]/70 focus:ring-2 focus:ring-primary-100/50",
    error: "text-xs text-red-500",
    passwordToggle:
      "text-white absolute right-3 opacity-40 hidden hover:opacity-70 transition top-1/2 -translate-y-1/2",
  },
  variants: {
    focused: {
      true: {
        input: "ring-2 ring-primary-100/50",
      },
    },
    isError: {
      true: {
        input:
          "border-red-500 text-red-600 placeholder:text-red-400 focus:ring-2 focus:ring-red-400/50",
      },
    },
    isPassword: {
      true: {
        passwordToggle: "block",
      },
    },
    disabled: {
      true: {
        input:
          "bg-gray-200 border-gray-300 text-gray-500 placeholder:text-gray-400 cursor-not-allowed opacity-50",
      },
    },
    size: {
      sm: { input: "text-sm p-2" },
      md: { input: "text-base p-3 sm:p-4" },
      lg: { input: "text-lg p-4 sm:p-5" },
    },
  },
  defaultVariants: {
    focused: false,
    isError: false,
    disabled: false,
    isPassword: false,
    size: "md",
  },
});

type InputVariants = VariantProps<typeof InputTv>;

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    InputVariants {
  label?: string;
  placeholder?: string;
  value?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
}

interface ControlledInputProps<T extends FieldValues> extends InputProps {
  control: Control<T, any>; // The control object from react-hook-form
  name: Path<T>; // The name of the field in the form
}

export const Input = ({
  label,
  placeholder,
  value,
  error,
  size = "md",
  ...rest
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const { type, disabled } = rest;

  const [isPasswordShown, setIsPasswordShown] = useState<undefined | boolean>(
    type === "password" ? false : undefined,
  );

  const handleOnFocus = useCallback(() => setIsFocused(true), []);

  const handleOnBlur = useCallback(() => setIsFocused(false), []);

  const styles = useMemo(
    () =>
      InputTv({
        focused: isFocused,
        disabled: disabled,
        isPassword: Boolean(type === "password"),
        isError: Boolean(error),
        size,
      }),
    [isFocused, disabled, error, type, size],
  );

  const handleOnPasswordToggle = useCallback(() => {
    if (type !== "password") return;
    setIsPasswordShown((prev) => !prev);
  }, [type]);

  return (
    <div className={styles.container()}>
      {label && <label className={styles.label()}>{label}</label>}
      <div className="relative flex w-full flex-row justify-end">
        <input
          {...rest}
          onBlur={handleOnBlur}
          onFocus={handleOnFocus}
          className={styles.input()}
          type={type === "password" && !isPasswordShown ? "password" : "text"}
          placeholder={placeholder}
          value={value}
        />

        {type === "password" && !disabled && (
          <button
            type="button"
            onClick={handleOnPasswordToggle}
            className={styles.passwordToggle()}
          >
            {isPasswordShown ? (
              <EyeOff className="w-4 h-4 sm:w-6 sm:h-6" />
            ) : (
              <Eye className="w-4 h-4 sm:w-6 sm:h-6" />
            )}
          </button>
        )}
      </div>
      {error && <span className={styles.error()}>{error}</span>}
    </div>
  );
};

export const ControlledInput = <T extends FieldValues>({
  control,
  name,
  ...rest
}: ControlledInputProps<T>) => {
  const { field, fieldState } = useController({
    control,
    name,
  });
  const { t } = useTranslation();

  return (
    <Input
      label={rest.label}
      placeholder={t("TypeSomething")}
      value={field.value ?? ""}
      error={fieldState.error?.message}
      onChange={field.onChange}
      {...rest}
    />
  );
};
