import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { Loading } from "./ui/Loading";
import { AppRoutes } from "@/api/Routes";
import { useAuth } from "@/stores/AuthStore";

interface AuthWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const AuthWrapper = ({
  children,
  requireAuth = true,
}: AuthWrapperProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, user, token, refreshUser } = useAuth();

  useEffect(() => {
    // Try to refresh user data if we have a valid token but no user
    // Make sure we actually have a token before attempting refresh
    if (isAuthenticated && !user && !isLoading && token) {
      refreshUser();
    }
  }, [isAuthenticated, user, isLoading, token, refreshUser]);

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        // User is not authenticated but auth is required
        navigate(AppRoutes.LOGIN, { replace: true });
      } else if (!requireAuth && isAuthenticated) {
        // User is authenticated but trying to access auth pages
        navigate("/home", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, navigate, location.pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return <Loading />;
  }

  // If auth is required but user is not authenticated, show loading
  // (will redirect to login shortly)
  if (requireAuth && !isAuthenticated) {
    return <Loading />;
  }

  // If auth is not required but user is authenticated, show loading
  // (will redirect to dashboard shortly)
  if (!requireAuth && isAuthenticated) {
    return <Loading />;
  }

  return <>{children}</>;
};
