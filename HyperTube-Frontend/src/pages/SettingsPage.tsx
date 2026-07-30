import { ControlledInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import DevicesList from "@/components/settings/DevicesList";
import { Separator } from "@/components/ui/Separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTranslation } from "react-i18next";
import PictureUpload from "@/components/PictureUpload";
import { useEffect, useState } from "react";
import {
  useChangePassword,
  useDevices,
  useRevokeAllDevices,
  useRevokeDevice,
} from "@/hooks/UseAuthQuery";
import { useAuth } from "@/stores/AuthStore";
import {
  UpdatePasswordSchema,
  UpdateProfileSchema,
} from "@/schemas/UpdateProfileSchema";
import { useEditUser, useUploadProfilePicture } from "@/hooks/UseUsersQuery";

// use zod schemas with react-hook-form for strict validation

export default function SettingsPage() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Error state management
  const [errors, setErrors] = useState<{
    profile?: string;
    password?: string;
    picture?: string;
  }>({});

  // Success state management
  const [successMessages, setSuccessMessages] = useState<{
    profile?: string;
    password?: string;
    picture?: string;
  }>({});

  const devices = useDevices().data || [];

  // Initialize mutations
  const updatePassword = useChangePassword();
  const uploadProfilePicture = useUploadProfilePicture();
  const updateUser = useEditUser();
  const revokeDevice = useRevokeDevice();
  const revokeAllDevices = useRevokeAllDevices();

  const { user, refreshUser } = useAuth();
  const profile = user;

  useEffect(() => {
    if (!user) {
      refreshUser();
    }
  }, [user, refreshUser]);

  // Refresh user data when component mounts

  // Mock react-hook-form controls (UI only)
  const profileForm = useForm<z.infer<typeof UpdateProfileSchema>>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      firstName: profile?.firstName || "John",
      lastName: profile?.lastName || "Doe",
      email: profile?.email || "john.doe@example.com",
      username: profile?.username || "johndoe",
      preferredLanguage: (profile?.preferredLanguage as string) || "en",
    },
    mode: "onChange",
  });

  const passwordForm = useForm<z.infer<typeof UpdatePasswordSchema>>({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onChange",
  });

  // Extract handler functions
  const handlers = useSettingsHandlers({
    // auth,
    profile,
    profileForm,
    passwordForm,
    selectedImage,
    updatePassword,
    uploadProfilePicture,
    updateUser,
    revokeDevice,
    revokeAllDevices,
    setErrors,
    setSuccessMessages,
    setSelectedImage,
    setImagePreview,
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto backdrop-blur-xs border border-white/10 xl:rounded-2xl bg-white/5 mt-10">
      <SettingsHeader t={t} />

      <ProfilePictureSection
        profile={profile}
        imagePreview={imagePreview}
        errors={errors}
        successMessages={successMessages}
        uploadProfilePicture={uploadProfilePicture}
        onImageSelect={setSelectedImage}
        onImageChange={setImagePreview}
        onImageSubmit={handlers.handleImageSubmit}
        t={t}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileSection
          profileForm={profileForm}
          errors={errors}
          successMessages={successMessages}
          updateUser={updateUser}
          onUpdateUser={handlers.handleUpdateUser}
          onReset={handlers.handleProfileReset}
          t={t}
        />

        <PasswordForm
          passwordForm={passwordForm}
          errors={errors}
          successMessages={successMessages}
          updatePassword={updatePassword}
          onChangePassword={handlers.changePassword}
          t={t}
        />
      </div>

      <Separator label={t("SettingsPage.security")} />

      <DevicesSection
        devices={devices}
        onRevoke={handlers.handleRevokeDevice}
        onRevokeOthers={handlers.handleRevokeAllDevices}
        t={t}
      />
    </div>
  );
}

// Custom hook for all handlers
function useSettingsHandlers({
  auth,
  profile,
  profileForm,
  passwordForm,
  selectedImage,
  updatePassword,
  uploadProfilePicture,
  updateUser,
  revokeDevice,
  revokeAllDevices,
  setErrors,
  setSuccessMessages,
  setSelectedImage,
  setImagePreview,
}: any) {
  const handleRevokeAllDevices = () => {
    // Revoke all devices except the current one
    revokeAllDevices.mutate(undefined, {
      onError: (_error: any) => {
        // Handle error (e.g., show notification)
      },
      onSuccess: () => {
        // Handle success (e.g., show notification, refresh device list)
      },
    });
  };

  const handleRevokeDevice = (deviceId: string) => {
    // Revoke a specific device
    revokeDevice.mutate(deviceId, {
      onError: (_error: any) => {
        // Handle error (e.g., show notification)
      },
      onSuccess: (response: any) => {
        // Handle success (e.g., show notification, refresh device list)
        if (response?.isCurrentDevice) {
          // User revoked their current device, logout them
          auth.logout();
          // Optionally show a message before redirect
          // window.location.href = '/login'; // This will happen automatically due to auth state change
        }
      },
    });
  };

  const handleUpdateUser = profileForm.handleSubmit(
    (values: z.infer<typeof UpdateProfileSchema>) => {
      // Clear previous messages
      setErrors((prev: any) => ({ ...prev, profile: undefined }));
      setSuccessMessages((prev: any) => ({ ...prev, profile: undefined }));

      if (!profile) return;
      if (!profileForm.formState.isDirty) return;

      updateUser.mutate(
        {
          ...values,
          userId: profile.id,
        },
        {
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update profile";
            setErrors((prev: any) => ({ ...prev, profile: errorMessage }));
          },
          onSuccess: () => {
            setSuccessMessages((prev: any) => ({
              ...prev,
              profile: "Profile updated successfully!",
            }));

            setTimeout(() => {
              setSuccessMessages((prev: any) => ({
                ...prev,
                profile: undefined,
              }));
            }, 5000);
          },
        },
      );
    },
  );

  const changePassword = passwordForm.handleSubmit(
    (values: z.infer<typeof UpdatePasswordSchema>) => {
      // Clear previous messages
      setErrors((prev: any) => ({ ...prev, password: undefined }));
      setSuccessMessages((prev: any) => ({ ...prev, password: undefined }));

      updatePassword.mutate(
        {
          oldPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
        {
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update password";
            setErrors((prev: any) => ({ ...prev, password: errorMessage }));
          },
          onSuccess: () => {
            setSuccessMessages((prev: any) => ({
              ...prev,
              password: "Password updated successfully!",
            }));
            passwordForm.reset();
            setTimeout(() => {
              setSuccessMessages((prev: any) => ({
                ...prev,
                password: undefined,
              }));
            }, 5000);
          },
        },
      );
    },
  );

  const handleImageSubmit = () => {
    if (selectedImage) {
      // Clear previous messages
      setErrors((prev: any) => ({ ...prev, picture: undefined }));
      setSuccessMessages((prev: any) => ({ ...prev, picture: undefined }));

      uploadProfilePicture.mutate(
        { file: selectedImage, userId: profile?.id || "" },
        {
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              "Failed to upload picture";
            setErrors((prev: any) => ({ ...prev, picture: errorMessage }));
          },
          onSuccess: () => {
            setSuccessMessages((prev: any) => ({
              ...prev,
              picture: "Profile picture updated successfully!",
            }));
            setSelectedImage(null);
            setImagePreview(null);
            setTimeout(() => {
              setSuccessMessages((prev: any) => ({
                ...prev,
                picture: undefined,
              }));
            }, 5000);
          },
        },
      );
    }
  };

  const handleProfileReset = () => {
    profileForm.reset();
    setErrors((prev: any) => ({ ...prev, profile: undefined }));
    setSuccessMessages((prev: any) => ({
      ...prev,
      profile: undefined,
    }));
  };

  return {
    handleRevokeAllDevices,
    handleRevokeDevice,
    handleUpdateUser,
    changePassword,
    handleImageSubmit,
    handleProfileReset,
  };
}

// Header component
function SettingsHeader({ t }: { t: any }) {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-semibold text-white/90">
        {t("SettingsPage.title")}
      </h1>
      <p className="text-white/70">{t("SettingsPage.subtitle")}</p>
    </>
  );
}

// Profile Picture Section
function ProfilePictureSection({
  profile,
  imagePreview,
  errors,
  successMessages,
  uploadProfilePicture,
  onImageSelect,
  onImageChange,
  onImageSubmit,
  t,
}: any) {
  return (
    <div className="flex flex-col items-center gap-2">
      <PictureUpload
        currentImage={profile?.picture || undefined}
        onImageSelect={onImageSelect}
        onImageChange={onImageChange}
      />

      {/* Picture upload error message */}
      {errors.picture && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2 max-w-md text-center">
          {errors.picture}
        </div>
      )}

      {/* Picture upload success message */}
      {successMessages.picture && (
        <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded px-3 py-2 max-w-md text-center">
          {successMessages.picture}
        </div>
      )}

      {imagePreview && (
        <>
          <Button
            type="button"
            label={
              uploadProfilePicture.isPending
                ? "Uploading..."
                : t("SettingsPage.submitPicture")
            }
            variant="Primary"
            size="sm"
            className="w-fit"
            onClick={onImageSubmit}
            disabled={uploadProfilePicture.isPending}
          >
            {uploadProfilePicture.isPending
              ? "Uploading..."
              : t("SettingsPage.submitPicture")}
          </Button>
          <p className="text-xs text-white/60">
            {t("SettingsPage.dragAndDrop")}
          </p>
        </>
      )}
    </div>
  );
}

// Profile Section
function ProfileSection({
  profileForm,
  errors,
  successMessages,
  updateUser,
  onUpdateUser,
  onReset,
  t,
}: any) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
      <h2 className="text-lg font-medium text-white/90 mb-4">
        {t("SettingsPage.Profile.title")}
      </h2>

      {/* Profile error message */}
      {errors.profile && (
        <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
          {errors.profile}
        </div>
      )}

      {/* Profile success message */}
      {successMessages.profile && (
        <div className="mb-4 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
          {successMessages.profile}
        </div>
      )}

      <form className="space-y-3" onSubmit={onUpdateUser}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ControlledInput
            control={profileForm.control}
            name="firstName"
            label={t("SettingsPage.Profile.firstName")}
            placeholder={t("SettingsPage.Profile.firstName")}
          />
          <ControlledInput
            control={profileForm.control}
            name="lastName"
            label={t("SettingsPage.Profile.lastName")}
            placeholder={t("SettingsPage.Profile.lastName")}
          />
        </div>
        <ControlledInput
          control={profileForm.control}
          name="email"
          label={t("SettingsPage.Profile.email")}
          placeholder={t("SettingsPage.Profile.email")}
          type="email"
        />
        <ControlledInput
          control={profileForm.control}
          name="username"
          label={t("SettingsPage.Profile.username")}
          placeholder={t("SettingsPage.Profile.username")}
        />
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#EAEAEA]/80">
            {t("SettingsPage.Profile.preferredLanguage")}
          </label>
          <select
            {...profileForm.register("preferredLanguage")}
            className="w-full rounded-lg transition-all duration-300 ease-in-out focus:outline-none px-6 py-3 sm:py-4 font-normal bg-white/5 border border-white/20 text-[#EAEAEA] focus:ring-2 focus:ring-primary-100/50"
          >
            <option value="en" className="bg-gray-800 text-white">
              English
            </option>
            <option value="fr" className="bg-gray-800 text-white">
              Français
            </option>
            <option value="es" className="bg-gray-800 text-white">
              Español
            </option>
            <option value="de" className="bg-gray-800 text-white">
              Deutsch
            </option>
          </select>
        </div>
        <div className="pt-2 flex gap-3">
          <Button
            type="submit"
            label={
              updateUser.isPending
                ? "Saving..."
                : t("SettingsPage.Profile.saveChanges")
            }
            variant="Primary"
            size="md"
            disabled={updateUser.isPending || !profileForm.formState.isDirty}
          />
          <Button
            type="button"
            label={t("SettingsPage.Profile.reset")}
            variant="Secondary"
            size="md"
            onClick={onReset}
            disabled={updateUser.isPending}
          />
        </div>
      </form>
    </section>
  );
}

// Password Form
function PasswordForm({
  passwordForm,
  errors,
  successMessages,
  updatePassword,
  onChangePassword,
  t,
}: any) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
      <h2 className="text-lg font-medium text-white/90 mb-4">
        {t("SettingsPage.Password.title")}
      </h2>

      {/* Password error message */}
      {errors.password && (
        <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
          {errors.password}
        </div>
      )}

      {/* Password success message */}
      {successMessages.password && (
        <div className="mb-4 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
          {successMessages.password}
        </div>
      )}

      <form className="space-y-3" onSubmit={onChangePassword}>
        <ControlledInput
          control={passwordForm.control}
          name="currentPassword"
          type="password"
          label={t("SettingsPage.Password.currentPassword")}
          placeholder="Enter current password"
        />
        <ControlledInput
          control={passwordForm.control}
          name="newPassword"
          type="password"
          label={t("SettingsPage.Password.newPassword")}
          placeholder="Enter new password"
        />
        <ControlledInput
          control={passwordForm.control}
          name="confirmNewPassword"
          type="password"
          label={t("SettingsPage.Password.confirmNewPassword")}
          placeholder="Confirm new password"
        />
        <div className="pt-2">
          <Button
            type="submit"
            label={
              updatePassword.isPending
                ? "Updating..."
                : t("SettingsPage.Password.updatePassword")
            }
            variant="White"
            size="md"
            disabled={updatePassword.isPending}
          />
        </div>
      </form>
    </section>
  );
}

// Devices Section
function DevicesSection({ devices, onRevoke, onRevokeOthers, t }: any) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white/90">
          {t("SettingsPage.loggedInDevices")}
        </h2>
      </div>
      <DevicesList
        devices={devices}
        onRevoke={onRevoke}
        revokingId={null}
        onRevokeOthers={onRevokeOthers}
      />
    </section>
  );
}
