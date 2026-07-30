import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebarOverlay } from "@/stores/OverlayStore";
import { AppRoutes } from "@/api/Routes";
import { useAuth } from "@/stores/AuthStore";
import useConfirmationPopupHandler from "./UseConfirmationPopup";
import { useTranslation } from "react-i18next";

const UseNavbar = () => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { t } = useTranslation();

  const sortRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { toggleSidebar } = useSidebarOverlay();
  const navigate = useNavigate();
  const { handleOpenConfirmation } = useConfirmationPopupHandler();

  const { user, logout } = useAuth();

  const displayName = useMemo(() => {
    return user
      ? user.firstName || user.lastName
        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
        : user.username
      : "Guest";
  }, [user]);

  const initials = useMemo(() => {
    return user
      ? user.firstName || user.lastName
        ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
        : (user.username?.slice(0, 2) ?? "").toUpperCase()
      : "";
  }, [user]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleProfile = () => setProfileOpen((v) => !v);
  const closeProfile = () => setProfileOpen(false);

  const onLogout = async () => {
    handleOpenConfirmation({
      title: t("Logout.title"),
      message: t("Logout.message"),
      onConfirm: async () => {
        await logout();
        navigate("/");
      },
    });
  };

  const goToProfile = () => {
    navigate(AppRoutes.PROFILE);
    setProfileOpen(false);
  };

  const goToSettings = () => {
    navigate(AppRoutes.SETTINGS);
    setProfileOpen(false);
  };

  return {
    // state
    searchFocused,
    profileOpen,

    // setters
    setSearchFocused,

    // refs
    sortRef,
    profileRef,
    searchInputRef,

    // values
    displayName,
    initials,
    user,

    // actions
    toggleSidebar,
    toggleProfile,
    closeProfile,
    onLogout,
    goToProfile,
    goToSettings,
  } as const;
};

export default UseNavbar;
