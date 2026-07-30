import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-filter backdrop-blur-sm border border-white/30 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-xl w-full text-center">
        <div className="mb-4">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white/80 text-2xl select-none">
            404
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          {t("NotFound") || "Page Not Found"}
        </h1>
        <p className="text-white/70 mb-6">
          {t("PageNotFoundMessage") ||
            "The page you're looking for doesn’t exist or has been moved."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="Primary"
            size="md"
            label={t("GoHome") || "Go Home"}
            onClick={() => navigate("/home", { replace: true })}
          />
          <Button
            variant="White"
            size="md"
            label={t("GoBack") || "Go Back"}
            onClick={() => navigate(-1)}
          />
        </div>
      </div>
    </div>
  );
}
