import { createBrowserRouter, Navigate } from "react-router-dom";
import RouteErrorBoundary from "@/pages/errors/RouteErrorBoundary";

import NotFound from "@/pages/NotFound";
import AuthLayout from "@/components/Layout/AuthLayout";
import SimpleAuthLayout from "@/components/Layout/SimpleAuthLayout";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import OAuthCallback from "@/pages/OAuthCallback";
import OAuthSuccess from "@/pages/OAuthSuccess";
import { AuthWrapper } from "@/components/AuthWrapper";
import AppLayout from "@/components/Layout/AppLayout";
import HomePage from "@/pages/HomePage";
import MovieWatchPage from "@/pages/MovieWatch";
import FavoritesPage from "@/pages/FavoritesPage";
import TrendingPage from "@/pages/TrendingPage";
import LibraryPage from "@/pages/LibraryPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import SearchPage from "@/pages/SearchPage";
import EmailVerification from "@/pages/EmailVerification";
import ViewProfilePage from "@/pages/ViewProfilePage";
import LandingPage from "@/pages/LandingPage";

export const routes = createBrowserRouter([
  // Public Landing Page
  {
    path: "/",
    element: (
      <AuthWrapper requireAuth={false}>
        <LandingPage />
      </AuthWrapper>
    ),
  },
  // App routes (pathless layout)
  {
    element: (
      <AuthWrapper requireAuth={true}>
        <AppLayout />
      </AuthWrapper>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "home", element: <HomePage /> },
      {
        path: "movie/:id",
        element: <MovieWatchPage />,
        errorElement: <RouteErrorBoundary />,
      },
      { path: "favorites", element: <FavoritesPage /> },
      { path: "trending", element: <TrendingPage /> },
      { path: "library", element: <LibraryPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "profile/:username", element: <ViewProfilePage /> },
    ],
  },
  {
    path: "/auth",
    element: (
      <AuthWrapper requireAuth={false}>
        <AuthLayout />
      </AuthWrapper>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <LoginPage /> }, // /auth defaults to login
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  {
    path: "/auth/forgot-password",
    element: (
      <AuthWrapper requireAuth={false}>
        <SimpleAuthLayout>
          <ForgotPassword />
        </SimpleAuthLayout>
      </AuthWrapper>
    ),
  },
  {
    path: "/auth/reset-password",
    element: (
      <AuthWrapper requireAuth={false}>
        <SimpleAuthLayout>
          <ResetPassword />
        </SimpleAuthLayout>
      </AuthWrapper>
    ),
  },
  {
    path: "/auth/callback",
    element: <OAuthCallback />,
  },
  {
    path: "/auth/success",
    element: <OAuthSuccess />,
  },
  {
    path: "verify-email",
    element: <EmailVerification />,
  },
  {
    path: "/404",
    element: <NotFound />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
