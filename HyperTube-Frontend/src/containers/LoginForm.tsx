import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Separator from "@components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { ControlledInput } from "@/components/ui/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginCredentialsSchema } from "@/schemas/LoginSchema";
import type z from "zod";
import { useForm } from "react-hook-form";
import { Google } from "@/components/icons/Google";
import { FortyTwo } from "@/components/icons/FortyTwo";
import { AppRoutes } from "@/api/Routes";
import { useLogin, useOAuthLogin } from "@/hooks/UseAuthQuery";
import { useAuthStore } from "@/stores/AuthStore";
import { useTranslation } from "react-i18next";

type SignInSchemaType = z.infer<typeof LoginCredentialsSchema>;

const LoginForm = () => {
  const navigate = useNavigate();
  const oauthMutation = useOAuthLogin();
  const loginMutation = useLogin();
  const { t } = useTranslation();

  const {
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<SignInSchemaType>({
    resolver: zodResolver(LoginCredentialsSchema),
  });

  const handleOnSubmit = async (data: SignInSchemaType) => {
    const loginData = {
      emailOrUsername: data.username,
      password: data.password,
    };
    loginMutation.mutate(loginData, {
      onSuccess: async (response) => {
        useAuthStore.getState().setAuthData(response.user, response.token);
        navigate("/");
      },
      onError: (error: any) => {
        const details = error?.response?.data?.details;
        if (details && typeof details === "object") {
          let handledField = false;
          Object.keys(details).forEach((key) => {
            const value = (details as any)[key];
            const message =
              typeof value === "string"
                ? value
                : typeof value?.message === "string"
                  ? value.message
                  : "";

            let fieldKey: keyof SignInSchemaType | null = null;
            if (key === "password") fieldKey = "password";
            if (
              key === "username" ||
              key === "email" ||
              key === "emailOrUsername"
            )
              fieldKey = "username";

            if (fieldKey && message) {
              handledField = true;
              setError(fieldKey, { type: "server", message });
            }
          });

          if (!handledField) {
            const firstKey = Object.keys(details)[0];
            const first = (details as any)[firstKey];
            const firstMessage =
              typeof first === "string"
                ? first
                : typeof first?.message === "string"
                  ? first.message
                  : error?.response?.data?.message ||
                    "Login failed. Please try again.";
            setError("root" as any, {
              type: "server",
              message: firstMessage,
            });
          }
        } else if (error?.response?.data?.message) {
          setError("root" as any, {
            type: "server",
            message: error.response.data.message,
          });
        } else {
          setError("root" as any, {
            type: "server",
            message: "Login failed. Please try again.",
          });
        }
      },
    });
  };

  const handleGoogleLogin = useCallback(() => {
    oauthMutation.mutate({
      provider: "google",
      redirectUri: window.location.origin + "/oauth/callback",
    });
  }, [oauthMutation]);

  const handle42Login = useCallback(() => {
    oauthMutation.mutate({
      provider: "42",
      redirectUri: window.location.origin + "/oauth/callback",
    });
  }, [oauthMutation]);

  const isLoading = loginMutation.isPending || oauthMutation.isPending;
  const rootError =
    (errors.root as any)?.message ||
    loginMutation.error?.message ||
    oauthMutation.error?.message;

  return (
    <>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 text-center drop-shadow-lg">
        {t("Login.title")}
      </h1>

      {rootError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm text-center">{rootError}</p>
        </div>
      )}

      <form
        className="space-y-4 sm:space-y-6"
        onSubmit={handleSubmit(handleOnSubmit)}
      >
        <ControlledInput
          control={control}
          name="username"
          placeholder={t("Login.usernameOrEmail")}
          error={errors.username?.message}
        />

        <div>
          <ControlledInput
            name="password"
            control={control}
            placeholder={t("Login.password")}
            type="password"
            error={errors.password?.message}
          />
          <p className="text-right text-primary-100/70 sm:mt-3 mt-2 text-xs sm:text-sm">
            <Link
              to={AppRoutes.FORGOT_PASSWORD}
              className="text-primary-100 hover:underline transition-colors duration-200"
            >
              {t("Login.forgotPassword")}
            </Link>
          </p>
        </div>
        <Button
          label={isLoading ? t("Login.submitting") : t("Login.submit")}
          variant="Secondary"
          size="lg"
          isLoading={isLoading}
        />
      </form>
      <Separator label={t("Login.or")} />

      <div className="flex flex-col gap-3">
        <Button
          label={t("Login.loginWith42")}
          variant="White"
          size="lg"
          icon={FortyTwo}
          onClick={handle42Login}
          disabled={isLoading}
        />
        <Button
          label={t("Login.loginWithGoogle")}
          variant="White"
          size="lg"
          icon={Google}
          onClick={handleGoogleLogin}
          disabled={isLoading}
        />
      </div>
      <p className="text-white text-center mt-4 text-x sm:mt-6 text-xs sm:text-sm">
        {t("Login.dontHaveAccount")}{" "}
        <Link
          to={AppRoutes.REGISTER}
          className="text-primary-100 hover:underline"
        >
          {t("Login.register")}
        </Link>
      </p>
    </>
  );
};

export default LoginForm;
