interface FlagIconProps {
  className?: string;
}

export const USFlag = ({ className = "w-5 h-5" }: FlagIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="16" rx="2" fill="#B22234" />
    <rect width="24" height="1.2" fill="white" />
    <rect y="2.4" width="24" height="1.2" fill="white" />
    <rect y="4.8" width="24" height="1.2" fill="white" />
    <rect y="7.2" width="24" height="1.2" fill="white" />
    <rect y="9.6" width="24" height="1.2" fill="white" />
    <rect y="12" width="24" height="1.2" fill="white" />
    <rect y="14.4" width="24" height="1.6" fill="white" />
    <rect width="9.6" height="8.6" fill="#3C3B6E" />
  </svg>
);

export const FranceFlag = ({ className = "w-5 h-5" }: FlagIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="16" rx="2" fill="#ED2939" />
    <rect width="8" height="16" fill="#002395" />
    <rect x="8" width="8" height="16" fill="white" />
  </svg>
);

export const SpainFlag = ({ className = "w-5 h-5" }: FlagIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="16" rx="2" fill="#C60B1E" />
    <rect y="4" width="24" height="8" fill="#FFC400" />
  </svg>
);

export const GermanyFlag = ({ className = "w-5 h-5" }: FlagIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="16" rx="2" fill="#FFCE00" />
    <rect width="24" height="5.33" fill="#000000" />
    <rect y="5.33" width="24" height="5.34" fill="#DD0000" />
  </svg>
);
