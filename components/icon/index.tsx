"use client";

import type { ElementType } from "react";
import { GoArrowUpRight } from "react-icons/go";
import {
  RiAddLine,
  RiArticleLine,
  RiBankCardLine,
  RiBookLine,
  RiBuildingFill,
  RiChatSmile2Line,
  RiDatabaseLine,
  RiDiscordLine,
  RiEditLine,
  RiEyeLine,
  RiFileCopy2Line,
  RiGiftLine,
  RiGithubLine,
  RiHomeLine,
  RiImage2Line,
  RiMailFill,
  RiMapPinFill,
  RiMoneyCnyCircleFill,
  RiOrderPlayLine,
  RiTwitterLine,
  RiUserLine,
  RiVipCrownLine,
} from "react-icons/ri";

const iconMap: Record<string, ElementType> = {
  GoArrowUpRight,
  RiAddLine,
  RiArticleLine,
  RiBankCardLine,
  RiBookLine,
  RiBuildingFill,
  RiChatSmile2Line,
  RiFileCopy2Line,
  RiCopy2Line: RiFileCopy2Line,
  RiDatabaseLine,
  RiDiscordLine,
  RiEditLine,
  RiEyeLine,
  RiGiftLine,
  RiGithubLine,
  RiHomeLine,
  RiImage2Line,
  RiMailFill,
  RiMapPinFill,
  RiMoneyCnyCircleFill,
  RiOrderPlayLine,
  RiTwitterLine,
  RiUserLine,
  RiVipCrownLine,
};

export default function Icon({
  name,
  className,
  onClick,
}: {
  name: string;
  className?: string;
  onClick?: () => void;
}) {
  const IconComponent = iconMap[name];

  // Return null if no icon is found
  if (!IconComponent) return null;

  // Render the icon component instead of returning it directly
  return (
    <IconComponent
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    />
  );
}
