import React from "react";

interface MotionControlIconProps {
  className?: string;
}

export const MotionControlIcon: React.FC<MotionControlIconProps> = ({
  className,
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Head */}
      <circle cx="12" cy="4.5" r="2" />
      {/* Body */}
      <line x1="12" y1="6.5" x2="12" y2="14" />
      {/* Arms */}
      <line x1="12" y1="9" x2="8" y2="12" />
      <line x1="12" y1="9" x2="16" y2="12" />
      {/* Legs */}
      <line x1="12" y1="14" x2="9" y2="19" />
      <line x1="12" y1="14" x2="15" y2="19" />
      {/* Motion tracking points */}
      <circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
};
