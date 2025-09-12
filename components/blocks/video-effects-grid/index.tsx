"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { VideoEffect } from "@/types/video-effect";

interface VideoEffectsGridProps {
  effects?: VideoEffect[];
  onSelect?: (effect: VideoEffect) => void; // 选择模式回调
  showTitle?: boolean; // 是否显示标题
}

export function VideoEffectsGrid({
  effects = [],
  onSelect,
  showTitle = true,
}: VideoEffectsGridProps) {
  const tEffects = useTranslations("effects");
  const t = useTranslations("pages.videoEffects");

  return (
    <div className="w-full">
      {showTitle && (
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">
          {t("gridTitle")}
        </h1>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {effects.map((effect) => (
          <VideoEffectCard
            key={effect.id}
            effect={effect}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

interface VideoEffectCardProps {
  effect: VideoEffect;
  onSelect?: (effect: VideoEffect) => void;
}

function VideoEffectCard({ effect, onSelect }: VideoEffectCardProps) {
  const tEffects = useTranslations("effects");
  const t = useTranslations("pages.videoEffects");
  const [isHovered, setIsHovered] = useState(false);

  const effectTitle = effect.title || "Unknown Effect";

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(effect);
    }
  };

  const effectUrl = `/video-effects/${effect.slug}`;

  // 智能选择显示内容 - Linus式的好品味设计
  const getThumbnailSrc = () => {
    return (
      effect.preview_thumbnail ||
      effect.preview_image ||
      "/placeholder-effect.svg"
    );
  };

  const getAnimatedSrc = () => {
    return effect.preview_gif; // 只返回GIF，如果没有则为null
  };

  return (
    <div className="group relative w-full">
      {onSelect ? (
        // 选择模式
        <div
          onClick={handleClick}
          className="block cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <EffectCardContent
            effect={effect}
            thumbnailSrc={getThumbnailSrc()}
            animatedSrc={getAnimatedSrc()}
            isHovered={isHovered}
            effectTitle={effectTitle}
            buttonText={t("useThisEffect")}
          />
        </div>
      ) : (
        // 导航模式
        <Link
          href={effectUrl}
          className="block"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <EffectCardContent
            effect={effect}
            thumbnailSrc={getThumbnailSrc()}
            animatedSrc={getAnimatedSrc()}
            isHovered={isHovered}
            effectTitle={effectTitle}
            buttonText={t("useThisEffect")}
          />
        </Link>
      )}
    </div>
  );
}

// 卡片内容组件 - 消除重复代码
function EffectCardContent({
  effect,
  thumbnailSrc,
  animatedSrc,
  isHovered,
  effectTitle,
  buttonText,
}: {
  effect: VideoEffect;
  thumbnailSrc: string;
  animatedSrc: string | null;
  isHovered: boolean;
  effectTitle: string;
  buttonText: string;
}) {
  return (
    <div className="rounded-lg overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-gray-700 transition-all duration-300">
      {/* 媒体容器 - 4:3比例容器，匹配GIF原始比例 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-950">
        {/* 如果有GIF动图，始终显示动图；否则显示缩略图 */}
        {animatedSrc ? (
          // 有GIF动图时，始终显示动图，hover时放大
          <img
            src={animatedSrc}
            alt={effectTitle}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
              isHovered ? "scale-105" : "scale-100"
            }`}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          />
        ) : (
          // 没有GIF时，显示缩略图，hover时放大
          <img
            src={thumbnailSrc}
            alt={effectTitle}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
              isHovered ? "scale-105" : "scale-100"
            }`}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          />
        )}

        {/* HOT标签 */}
        {effect.is_hot && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/20">
              HOT
            </div>
          </div>
        )}

        {/* Hover遮罩和按钮 */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 whitespace-nowrap">
              {buttonText}
            </button>
          </div>
        </div>
      </div>

      {/* 标题区域 */}
      <div className="p-3 bg-gray-900 border-t border-gray-800">
        <h2 className="text-white text-sm font-medium line-clamp-1">
          {effectTitle}
        </h2>
      </div>
    </div>
  );
}
