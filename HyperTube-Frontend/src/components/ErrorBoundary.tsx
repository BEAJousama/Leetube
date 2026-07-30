import { t } from "i18next";
import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // console.error("ErrorBoundary caught an error:", error, errorInfo); // Removed for lint compliance
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background-100">
          <div className="bg-white/10 backdrop-filter backdrop-blur-sm border border-white/30 rounded-3xl p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              {t("SomethingWentWrong")}
            </h2>
            <p className="text-white/80 mb-6">
              {t("SomthingWentWrongMessage")}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-100 hover:bg-primary-100/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t("RefreshPage")}
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-red-400 cursor-pointer">
                  Error Details
                </summary>
                <pre className="text-red-300 text-xs mt-2 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error handling in functional components
export const useErrorHandler = () => {
  return (_error: Error, _errorInfo?: { componentStack: string }) => {
    // You can also send this to an error reporting service
  };
};
