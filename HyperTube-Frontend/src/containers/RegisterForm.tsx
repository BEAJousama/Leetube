import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@components/ui/Button";
import Separator from "@components/ui/Separator";
import { ControlledInput } from "@/components/ui/Input";
import { UserRegistrationSchema } from "@/schemas/RegistrationSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type z from "zod";
import { FortyTwo } from "@/components/icons/FortyTwo";
import { Google } from "@/components/icons/Google";
import { useRegister, useOAuthLogin } from "@/hooks/UseAuthQuery";
import { useAuthStore } from "@/stores/AuthStore";
import { useTranslation } from "react-i18next";

export type UserRegistrationType = z.infer<typeof UserRegistrationSchema>;

const RegisterForm = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const oauthMutation = useOAuthLogin();
  const { t } = useTranslation();

  const {
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<UserRegistrationType>({
    resolver: zodResolver(UserRegistrationSchema),
  });

  const handleOnSubmit = useCallback(
    async (data: UserRegistrationType) => {
      if (
        !data.firstName ||
        !data.lastName ||
        !data.username ||
        !data.email ||
        !data.password
      ) {
        return;
      }
      const registrationData = {
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      };
      registerMutation.mutate(registrationData, {
        onSuccess: async (response) => {
          useAuthStore.getState().setAuthData(response.user, response.token);
          navigate("/");
        },
        onError: (error: any) => {
          const details = error?.response?.data?.details;
          if (details && typeof details === "object") {
            // Handle both field-mapped errors and array/numeric-keyed errors
            let handledField = false;
            Object.keys(details).forEach((key) => {
              const value = (details as any)[key];
              const message =
                typeof value === "string"
                  ? value
                  : typeof value?.message === "string"
                    ? value.message
                    : "";
              if (
                [
                  "firstName",
                  "lastName",
                  "username",
                  "email",
                  "password",
                ].includes(key) &&
                message
              ) {
                handledField = true;
                setError(key as keyof UserRegistrationType, {
                  type: "server",
                  message,
                });
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
                      "Registration failed. Please try again.";
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
              message: "Registration failed. Please try again.",
            });
          }
        },
      });
    },
    [registerMutation, navigate, setError],
  );

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

  const isLoading = registerMutation.isPending || oauthMutation.isPending;
  const rootError =
    (errors.root as any)?.message ||
    registerMutation.error?.message ||
    oauthMutation.error?.message;

  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-6 text-center drop-shadow-lg">
        {t("Register.title")}
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
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          <ControlledInput
            type="text"
            name="firstName"
            control={control}
            placeholder={t("Register.firstName")}
            error={errors.firstName?.message}
          />
          <ControlledInput
            type="text"
            name="lastName"
            control={control}
            placeholder={t("Register.lastName")}
            error={errors.lastName?.message}
          />
        </div>

        <ControlledInput
          name="username"
          control={control}
          placeholder={t("Register.username")}
          error={errors.username?.message}
        />

        <ControlledInput
          type="email"
          name="email"
          control={control}
          placeholder={t("Register.email")}
          error={errors.email?.message}
        />

        <ControlledInput
          name="password"
          control={control}
          type="password"
          placeholder={t("Register.password")}
          error={errors.password?.message}
        />

        <Button
          label={isLoading ? t("Register.submitting") : t("Register.submit")}
          variant="Secondary"
          size="lg"
          isLoading={isLoading}
        />
      </form>
      <Separator />

      <div className="flex flex-col gap-3">
        <Button
          label={t("Register.registerWith42")}
          size="lg"
          variant="White"
          icon={FortyTwo}
          onClick={handle42Login}
          disabled={isLoading}
        />
        <Button
          label={t("Register.registerWithGoogle")}
          size="lg"
          variant="White"
          icon={Google}
          onClick={handleGoogleLogin}
          disabled={isLoading}
        />
      </div>
      <p className="text-center mt-6 text-sm text-white">
        {t("Register.alreadyHaveAccount")}{" "}
        <Link to="/auth/login" className="text-primary-100 hover:underline">
          {t("Register.login")}
        </Link>
      </p>
    </>
  );
};

export default RegisterForm;
