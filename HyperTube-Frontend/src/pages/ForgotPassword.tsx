import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { ControlledInput } from "@/components/ui/Input";
import {
  ForgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/schemas/PasswordResetSchema";
import { useForgotPassword } from "@/hooks/UseAuthQuery";
import { AppRoutes } from "@/api/Routes";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const forgotPasswordMutation = useForgotPassword();
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = useCallback(
    async (data: ForgotPasswordFormData) => {
      try {
        await forgotPasswordMutation.mutateAsync(data);
        setIsSuccess(true);
      } catch (_err: any) {
        // console.error("Forgot password error:", err);
      }
    },
    [forgotPasswordMutation],
  );

  const isLoading = forgotPasswordMutation.isPending;
  const error = forgotPasswordMutation.error?.message;

  if (isSuccess) {
    return (
      <>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {t("ForgotPassword.checkEmail")}
          </h1>
          <p className="text-white/80">
            {t("ForgotPassword.checkEmailMessage")}
          </p>
        </div>

        <div className="space-y-4">
          <Button
            label={t("ForgotPassword.backToLogin")}
            variant="Secondary"
            size="lg"
            onClick={() => (window.location.href = AppRoutes.LOGIN)}
          />

          <p className="text-center text-white/60 text-sm">
            {t("ForgotPassword.dontReceive")}{" "}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-primary-100 hover:underline"
            >
              {t("ForgotPassword.tryAgain")}
            </button>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          {t("ForgotPassword.title")}
        </h1>
        <p className="text-white/80">{t("ForgotPassword.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ControlledInput
          control={control}
          name="email"
          label={t("ForgotPassword.inputLabel")}
          placeholder={t("ForgotPassword.inputPlaceholder")}
          type="email"
          error={errors.email?.message}
        />

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        <Button
          label={
            isLoading
              ? t("ForgotPassword.submitting")
              : t("ForgotPassword.submit")
          }
          variant="Secondary"
          size="lg"
          isLoading={isLoading}
        />
      </form>

      <div className="mt-6 text-center">
        <p className="text-white/60 text-sm">
          {t("ForgotPassword.remembered")}{" "}
          <Link
            to={AppRoutes.LOGIN}
            className="text-primary-100 hover:underline"
          >
            {t("ForgotPassword.backToLogin")}
          </Link>
        </p>
      </div>
    </>
  );
};

export default ForgotPassword;
