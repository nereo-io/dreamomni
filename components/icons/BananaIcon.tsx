import React from "react";

interface BananaIconProps {
  className?: string;
}

export const BananaIcon: React.FC<BananaIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 简化的香蕉轮廓 */}
      <path d="M17 10c0-3-1-6-4-7 0 0-1 2-4 2S5 3 5 3c-3 1-4 4-4 7 0 4 3 8 8 8s8-4 8-8z" />
      <path d="M9 5c0 0 0 8 0 8" />
    </svg>
  );
};

// 或者直接使用emoji作为备选方案
export const BananaEmoji: React.FC<{ className?: string }> = ({ className }) => {
  return <span className={className}>🍌</span>;
};