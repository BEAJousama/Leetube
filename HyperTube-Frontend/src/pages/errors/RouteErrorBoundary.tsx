import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";

type ErrorInfo = {
  status?: number;
  title: string;
  message: string;
};

function mapError(error: unknown, t: (k: string) => string): ErrorInfo {
  if (isRouteErrorResponse(error)) {
    const status = error.status;
    switch (status) {
      case 404:
        return {
          status,
          title: t("NotFound"),
          message: t("PageNotFoundMessage"),
        };
      case 401:
      case 403:
        return {
          status,
          title: t("AccessDenied"),
          message: t("AccessDeniedMessage"),
        };
      case 500:
        return {
          status,
          title: t("ServerError"),
          message: t("ServerErrorMessage"),
        };
      default:
        return {
          status,
          title: t("UnexpectedError"),
          message: t("UnexpectedErrorMessage"),
        };
    }
  }

  const anyErr = error as any;
  const status = anyErr?.response?.status as number | undefined;
  if (typeof status === "number") {
    switch (status) {
      case 404:
        return {
          status,
          title: t("NotFound"),
          message: t("PageNotFoundMessage"),
        };
      case 401:
      case 403:
        return {
          status,
          title: t("AccessDenied"),
          message: t("AccessDeniedMessage"),
        };
      case 500:
        return {
          status,
          title: t("ServerError"),
          message: t("ServerErrorMessage"),
        };
      default:
        return {
          status,
          title: t("UnexpectedError"),
          message: anyErr?.message || t("UnexpectedErrorMessage"),
        };
    }
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { title: t("Offline"), message: t("OfflineMessage") };
  }

  return {
    title: t("SomethingWentWrong"),
    message: t("SomthingWentWrongMessage"),
  };
}

export default function RouteErrorBoundary() {
  const routeError = useRouteError();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const info = mapError(routeError, t);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-filter backdrop-blur-sm border border-white/30 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-lg w-full text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          {info.title}
        </h1>
        {info.status && (
          <p className="text-white/60 text-sm mb-1">HTTP {info.status}</p>
        )}
        <p className="text-white/80 mb-6">{info.message}</p>
        <div className="flex items-center justify-center gap-3 sm:flex-nowrap flex-wrap">
          <Button
            variant="Primary"
            size="md"
            label={t("GoHome")}
            onClick={() => navigate("/home", { replace: true })}
          />
          <Button
            variant="White"
            size="md"
            label={t("GoBack")}
            onClick={() => navigate(-1)}
          />
          <Button
            variant="Secondary"
            size="md"
            label={t("RefreshPage")}
            onClick={() => window.location.reload()}
          />
        </div>
        {process.env.NODE_ENV === "development" && routeError && (
          <details className="mt-4 text-left">
            <summary className="text-red-400 cursor-pointer">
              Error Details
            </summary>
            <pre className="text-red-300 text-xs mt-2 overflow-auto">
              {JSON.stringify(routeError as any, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
