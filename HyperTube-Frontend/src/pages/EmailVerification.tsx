import type React from "react";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { AuthAPI } from "@/api/AuthApi";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/stores/AuthStore";

const EmailVerification: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, setVerificationMessage, refreshUser } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => AuthAPI.verifyEmail(token),
    onSuccess: async () => {
      setVerificationMessage("success", t("emailVerification.success"));
      // Refresh the user data to update emailVerified
      if (isAuthenticated) {
        await refreshUser();
      }
      // Redirect based on authentication status
      if (isAuthenticated) {
        navigate("/home");
      } else {
        navigate("/auth/login");
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || t("emailVerification.failure");

      // Check if user is already verified
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("already")
      ) {
        setVerificationMessage(
          "already-verified",
          t("emailVerification.alreadyVerified"),
        );
      } else {
        setVerificationMessage("error", errorMessage);
      }

      // Redirect based on authentication status
      if (isAuthenticated) {
        navigate("/home");
      } else {
        navigate("/auth/login");
      }
    },
  });

  useEffect(() => {
    if (token) {
      verifyEmailMutation.mutate(token);
    } else {
      setVerificationMessage("error", t("emailVerification.invalidToken"));
      // Redirect based on authentication status
      if (isAuthenticated) {
        navigate("/home");
      } else {
        navigate("/auth/login");
      }
    }
  }, [
    token,
    verifyEmailMutation,
    t,
    isAuthenticated,
    navigate,
    setVerificationMessage,
  ]);

  // Return null to render nothing
  return null;
};

export default EmailVerification;
