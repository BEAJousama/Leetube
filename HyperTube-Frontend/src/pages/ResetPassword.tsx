import { useCallback, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { ControlledInput } from "@/components/ui/Input";
import {
  ResetPasswordSchema,
  type ResetPasswordFormData,
} from "@/schemas/PasswordResetSchema";
import { AuthAPI } from "@/api/AuthApi";
import { AppRoutes } from "@/api/Routes";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      setError(t("ResetPassword.noTokenError"));
      return;
    }
    setToken(tokenFromUrl);
  }, [searchParams, t]);

  const onSubmit = useCallback(
    async (data: ResetPasswordFormData) => {
      if (!token) {
        setError(t("ResetPassword.noTokenError"));
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        await AuthAPI.resetPassword(token, { password: data.password });

        setIsSuccess(true);
      } catch (err: any) {
        // console.error("Password reset error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            t("ResetPassword.genericError"),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [token, t],
  );

  const handleBackToLogin = () => {
    navigate(AppRoutes.LOGIN);
  };

  if (!token && !error) {
    return (
      <div className="text-center">
        <p className="text-white">{t("ResetPassword.loading")}</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {t("ResetPassword.successTitle")}
          </h1>
          <p className="text-white/80">{t("ResetPassword.successMessage")}</p>
        </div>

        <Button
          label={t("ResetPassword.successGoLogin")}
          variant="Secondary"
          size="lg"
          onClick={handleBackToLogin}
        />
      </>
    );
  }

  if (error && !token) {
    return (
      <>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {t("ResetPassword.invalidTitle")}
          </h1>
          <p className="text-white/80 mb-4">{error}</p>
        </div>

        <div className="space-y-4">
          <Button
            label={t("ResetPassword.requestNew")}
            variant="Secondary"
            size="lg"
            onClick={() => navigate(AppRoutes.FORGOT_PASSWORD)}
          />

          <Button
            label={t("ResetPassword.backToLogin")}
            variant="Outline"
            size="lg"
            onClick={handleBackToLogin}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          {t("ResetPassword.title")}
        </h1>
        <p className="text-white/80">{t("ResetPassword.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ControlledInput
          control={control}
          name="password"
          label={t("ResetPassword.passwordLabel")}
          placeholder={t("ResetPassword.passwordPlaceholder")}
          type="password"
          error={errors.password?.message}
        />

        <ControlledInput
          control={control}
          name="confirmPassword"
          label={t("ResetPassword.confirmPasswordLabel")}
          placeholder={t("ResetPassword.confirmPasswordPlaceholder")}
          type="password"
          error={errors.confirmPassword?.message}
        />

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        <Button
          label={
            isLoading
              ? t("ResetPassword.submitting")
              : t("ResetPassword.submit")
          }
          variant="Secondary"
          size="lg"
          isLoading={isLoading}
        />
      </form>

      <div className="mt-6 text-center">
        <p className="text-white/60 text-sm">
          {t("ResetPassword.remembered")}{" "}
          <Link
            to={AppRoutes.LOGIN}
            className="text-primary-100 hover:underline"
          >
            {t("ResetPassword.backToLogin")}
          </Link>
        </p>
      </div>
    </>
  );
};

export default ResetPassword;
