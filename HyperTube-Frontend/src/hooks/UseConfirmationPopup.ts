import { useConfirmationPopup } from "@/stores/ConfirmationPopupStore";
import { useConfirmationOverlay } from "@/stores/OverlayStore";
interface handleOpenConfirmationProps {
  title: string;
  message: string;
  onConfirm: () => void;
}

const useConfirmationPopupHandler = () => {
  const { open } = useConfirmationPopup();
  const { openConfirmation, closeConfirmation } = useConfirmationOverlay();

  const handleOpenConfirmation = ({
    title,
    message,
    onConfirm,
  }: handleOpenConfirmationProps) => {
    openConfirmation();
    open(title, message, onConfirm, async () => {
      closeConfirmation();
    });
  };

  return { handleOpenConfirmation };
};

export default useConfirmationPopupHandler;
