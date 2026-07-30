interface OverlayProps {
  isOpen?: boolean;
  onClick?: () => void;
  className?: string;
}

const Overlay = ({ isOpen, onClick, className }: OverlayProps) => {
  if (!isOpen) return null;
  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] ${className || ""}`}
      onClick={onClick}
    />
  );
};

export default Overlay;
