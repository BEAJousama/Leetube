import { create } from "zustand";

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  open: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    onCancel: () => void | Promise<void>,
  ) => void;
  close: () => void;
}
export const useConfirmationPopupStore = create<ConfirmationState>((set) => ({
  isOpen: false,
  title: "",
  message: "",
  onConfirm: async () => {},
  onCancel: () => {},
  open: (title, message, onConfirm, onCancel) =>
    set({ isOpen: true, title, message, onConfirm, onCancel }),
  close: () =>
    set({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {},
      onCancel: () => {},
    }),
}));

export const useConfirmationPopup = () => {
  const { isOpen, title, message, onConfirm, onCancel, open, close } =
    useConfirmationPopupStore();
  return {
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    open,
    close,
  };
};
