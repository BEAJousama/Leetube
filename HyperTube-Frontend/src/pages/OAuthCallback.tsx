import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/stores/AuthStore";
import { Loading } from "@/components/ui/Loading";
import { useTranslation } from "react-i18next";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback, isLoading, error } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Check if there's an error in the URL params
        const errorParam = searchParams.get("error");
        if (errorParam) {
          // console.error("OAuth error:", errorParam); // Removed for lint compliance
          navigate("/login?error=oauth_failed");
          return;
        }

        // Handle successful OAuth callback
        await handleOAuthCallback();
        navigate("/");
      } catch (_error) {
        // console.error("OAuth callback failed:", error); // Removed for lint compliance
        navigate("/login?error=oauth_failed");
      }
    };

    processOAuthCallback();
  }, [handleOAuthCallback, navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-200 mb-2">
            {t("OAuth.error")}
          </h2>
          <p className="text-red-200/80 mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t("OAuth.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loading />
        <p className="text-white mt-4 text-lg">
          {isLoading ? t("OAuth.completing") : t("OAuth.redirecting")}
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
