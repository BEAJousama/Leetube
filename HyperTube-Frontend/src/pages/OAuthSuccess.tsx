import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, setAuthData } from "@/stores/AuthStore";
import { setAccessToken } from "@/api/Client";
import { Loading } from "@/components/ui/Loading";
import { useTranslation } from "react-i18next";

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setLoading, clearError } = useAuth();
  const { t } = useTranslation();
  const hasProcessed = useRef(false);

  // Helper function to parse cookies
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(";").shift();
      return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    return null;
  };

  // Helper function to delete a cookie
  const deleteCookie = (name: string): void => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

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

        // Extract data from cookies and URL parameters
        let token = getCookie("oauthAccessToken");
        let userDataStr = getCookie("oauthUserData");

        // Retry mechanism: Sometimes cookies take a moment to be available after redirect
        if (!token || !userDataStr) {
          await new Promise((resolve) => setTimeout(resolve, 500));

          token = getCookie("oauthAccessToken");
          userDataStr = getCookie("oauthUserData");
        }

        if (!token || !userDataStr) {
          throw new Error(t("OAuth.missingData"));
        }

        // Parse user data from cookie
        const user = JSON.parse(userDataStr);

        // Set the token for API client
        setAccessToken(token);

        // Update auth store with OAuth data
        setAuthData(token, user);

        // Clean up OAuth cookies (they're temporary)
        deleteCookie("oauthAccessToken");
        deleteCookie("oauthUserData");

        // Clean the URL by replacing the current history entry
        window.history.replaceState({}, document.title, "/auth/success");

        // Redirect to dashboard
        navigate("/", { replace: true });
      } catch (_error: any) {
        // console.error("OAuth success handler failed:", error);

        // Clean up any OAuth cookies on error
        deleteCookie("oauthAccessToken");
        deleteCookie("oauthUserData");

        // Clear any potentially malicious data
        setAccessToken(null);
        setLoading(false);

        // Redirect to login with error
        navigate("/auth/login?error=oauth_failed", { replace: true });
      }
    };

    handleOAuthSuccess();
  }, [navigate, searchParams, setLoading, clearError, t]);

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
