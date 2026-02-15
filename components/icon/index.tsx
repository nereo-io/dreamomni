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
  RiDownloadLine,
  RiEditLine,
  RiEyeLine,
  RiFileCopy2Line,
  RiFilmLine,
  RiGiftLine,
  RiGithubLine,
  RiHdLine,
  RiHomeLine,
  RiImage2Line,
  RiInfinityLine,
  RiMailFill,
  RiMapPinFill,
  RiMoneyCnyCircleFill,
  RiOrderPlayLine,
  RiPaletteLine,
  RiPlayLine,
  RiQuillPenLine,
  RiRobot2Line,
  RiSettings3Line,
  RiStarLine,
  RiTimerLine,
  RiTwitterLine,
  RiUserLine,
  RiVideoLine,
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
  RiDownloadLine,
  RiFileCopy2Line,
  RiCopy2Line: RiFileCopy2Line,
  RiDatabaseLine,
  RiDiscordLine,
  RiEditLine,
  RiEyeLine,
  RiFilmLine,
  RiGiftLine,
  RiGithubLine,
  RiHdLine,
  RiHomeLine,
  RiImage2Line,
  RiInfinityLine,
  RiMailFill,
  RiMapPinFill,
  RiMoneyCnyCircleFill,
  RiOrderPlayLine,
  RiPaletteLine,
  RiPlayLine,
  RiQuillPenLine,
  RiRobot2Line,
  RiSettings3Line,
  RiStarLine,
  RiTimerLine,
  RiTwitterLine,
  RiUserLine,
  RiVideoLine,
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
