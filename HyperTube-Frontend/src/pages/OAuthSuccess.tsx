import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/stores/AuthStore";
import { setAccessToken } from "@/api/Client";
import { Loading } from "@/components/ui/Loading";
import { useTranslation } from "react-i18next";

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setLoading, clearError, handleOAuthCallback } = useAuth();
  const { t } = useTranslation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasProcessed.current) {
      return;
    }

    const handleOAuthSuccess = async () => {
      try {
        hasProcessed.current = true;
        setLoading(true);
        clearError();

        // Let the store handle fetching the token/user from the backend
        await handleOAuthCallback();

        // Clean the URL by replacing the current history entry
        window.history.replaceState({}, document.title, "/auth/success");

        // Redirect to dashboard
        navigate("/", { replace: true });
      } catch (_error: any) {
        // console.error("OAuth success handler failed:", error);
        
        // Clear any potentially malicious data
        setAccessToken(null);
        setLoading(false);

        // Redirect to login with error
        navigate("/auth/login?error=oauth_failed", { replace: true });
      }
    };

    handleOAuthSuccess();
  }, [navigate, searchParams, setLoading, clearError, handleOAuthCallback, t]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loading />
        <p className="text-white mt-4 text-lg">{t("OAuth.completing")}</p>
        <p className="text-white/60 mt-2 text-sm">{t("OAuth.pleaseWait")}</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
