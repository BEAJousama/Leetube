import { useConfirmationOverlay } from "@/stores/OverlayStore";
import { useConfirmationPopupStore } from "@/stores/ConfirmationPopupStore";
import { useEffect, useRef } from "react";
import { Button } from "./ui/Button";
import { useTranslation } from "react-i18next";

const ConfirmationPopup = () => {
  const { isConfirmationOpen, closeConfirmation } = useConfirmationOverlay();
  const { title, message, onConfirm, onCancel } = useConfirmationPopupStore();
  const { t } = useTranslation();
  const popupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isConfirmationOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirmation();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isConfirmationOpen, closeConfirmation]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeConfirmation();
    }
  };

  const handleCancel = async () => {
    try {
      await onCancel();
    } finally {
      closeConfirmation();
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      closeConfirmation();
    }
  };

  if (!isConfirmationOpen) return null;
  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-9999 flex items-center justify-center"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      onMouseDown={handleBackdropClick}
    >
      <div className="bg-white/20 text-white rounded-lg shadow-lg p-4 max-w-sm pointer-events-auto backdrop-blur-sm border border-white/40">
        <h2
          id="confirmation-dialog-title"
          className="text-xl font-semibold mb-4"
        >
          {title}
        </h2>
        <p id="confirmation-dialog-description" className="mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            onClick={handleCancel}
            label={t("Cancel")}
            variant="White"
            isIcon={false}
          />
          <Button
            onClick={handleConfirm}
            label={t("Confirm")}
            variant="Secondary"
            isIcon={false}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
