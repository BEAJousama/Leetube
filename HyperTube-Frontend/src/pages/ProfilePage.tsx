import { useEffect, useState } from "react";
import { useAuth } from "@/stores/AuthStore";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import {
  User,
  LogOut,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import useConfirmationPopupHandler from "@/hooks/UseConfirmationPopup";
import { useResendVerification } from "@/hooks";

const ProfilePage = () => {
  const { user, logout, refreshUser, isLoading } = useAuth();
  const { t } = useTranslation();
  const { handleOpenConfirmation } = useConfirmationPopupHandler();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { mutate: resendVerification } = useResendVerification();

  useEffect(() => {
    // Refresh user data when component mounts
    if (!user) {
      refreshUser();
    }
  }, [user, refreshUser]);

  const handleLogout = async () => {
    handleOpenConfirmation({
      title: t("Logout.title"),
      message: t("Logout.message"),
      onConfirm: async () => {
        await logout();
      },
    });
  };

  const handleResendVerification = () => {
    resendVerification(
      { email: user?.email || "" },
      {
        onSuccess: () => {
          setSuccessMessage("Mail sent to your email address");
          // Clear the message after 5 seconds
          setTimeout(() => setSuccessMessage(null), 5000);
        },
      },
    );
  };

  if (isLoading || !user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen text-primary-100 p-4">
      <div className="max-w-4xl mx-auto p-5 mt-10 rounded-3xl backdrop-filter backdrop-blur-xs border border-white/10">
        {/* Header */}
        <div className="bg-white/5 backdrop-filter backdrop-blur-sm border border-white/30 rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">
              {t("ProfilePage.title")}
            </h1>
            <Button
              label={t("ProfilePage.logout")}
              icon={LogOut}
              onClick={handleLogout}
              variant="Secondary"
              className="w-fit"
              size="sm"
            />
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white/5 backdrop-filter backdrop-blur-sm border border-white/30 rounded-3xl p-8 mb-6">
          <div className="flex items-center space-x-6 mb-6">
            {user?.picture ? (
              <img
                src={user?.picture}
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-24 h-24 rounded-full border-4 border-primary-100 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100/20 border-4 border-primary-100 flex items-center justify-center">
                <User className="w-12 h-12 text-primary-100" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-primary-100/80 text-lg">@{user?.username}</p>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary-100" />
                <div>
                  <p className="text-white/60 text-sm">
                    {t("ProfilePage.email")}
                  </p>
                  <p className="text-white">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-primary-100" />
                <div>
                  <p className="text-white/60 text-sm">
                    {t("ProfilePage.username")}
                  </p>
                  <p className="text-white">{user?.username}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {user?.emailVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <p className="text-white/60 text-sm">
                    {t("ProfilePage.emailStatus")}
                  </p>
                  <p
                    className={
                      user?.emailVerified ? "text-green-400" : "text-red-400"
                    }
                  >
                    {user?.emailVerified
                      ? t("ProfilePage.verified")
                      : t("ProfilePage.notVerified")}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-primary-100" />
                <div>
                  <p className="text-white/60 text-sm">
                    {t("ProfilePage.memberSince")}
                  </p>
                  <p className="text-white">
                    {new Date(user?.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!user?.emailVerified && (
            <>
              {/* Success message */}
              {successMessage && (
                <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-200 font-medium">{successMessage}</p>
                </div>
              )}

              <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <XCircle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-yellow-200 font-medium">
                      {t("ProfilePage.verification.title")}
                    </p>
                    <p className="text-yellow-200/80 text-sm">
                      {t("ProfilePage.verification.message")}
                    </p>
                  </div>
                </div>
                <div className="mt-4 w-fit">
                  <Button
                    label={t("ProfilePage.resendVerification")}
                    variant="White"
                    className="hover:bg-secondary-100/90 hover:text-white"
                    size="sm"
                    onClick={handleResendVerification}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
