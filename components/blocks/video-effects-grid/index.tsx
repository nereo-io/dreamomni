"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRef, useState } from "react";
import { VideoEffect } from "@/types/video-effect";

interface VideoEffectsGridProps {
  effects?: VideoEffect[];
}

export function VideoEffectsGrid({ effects = [] }: VideoEffectsGridProps) {
  const tEffects = useTranslations("effects");
  const t = useTranslations("pages.videoEffects");

  return (
    <div className="w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">
        {t("gridTitle")}
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {effects.map((effect) => (
          <VideoEffectCard key={effect.id} effect={effect} />
        ))}
      </div>
    </div>
  );
}

function VideoEffectCard({ effect }: { effect: VideoEffect }) {
  const tEffects = useTranslations("effects");
  const t = useTranslations("pages.videoEffects");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const effectTitle = effect.title || "Unknown Effect";

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Video play failed:", err);
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoLoadedData = () => {
    setIsVideoLoaded(true);
  };

  const effectUrl = `/video-effects/${effect.slug}`;

  return (
    <div className="group relative w-full">
      <Link
        href={effectUrl}
        className="block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Card Container */}
        <div className="rounded-lg overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-gray-700 transition-all duration-300">
          {/* Video/Image Container */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-950">
            {/* Video background */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${effect.preview_image})` }}
            />

            {effect.preview_video && (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-0 group-hover:opacity-100"
                poster={effect.preview_image || undefined}
                src={effect.preview_video}
                loop
                muted
                playsInline
                preload="auto"
                onLoadedData={handleVideoLoadedData}
              />
            )}

            {/* Hot badge - top left */}
            {effect.is_hot && (
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/20">
                  HOT
                </div>
              </div>
            )}


            {/* Hover overlay with button */}
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              {/* Button positioned at bottom center */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 whitespace-nowrap">
                  {t("useThisEffect")}
                </button>
              </div>
            </div>
          </div>

          {/* Title Section - Always visible at bottom */}
          <div className="p-3 bg-gray-900 border-t border-gray-800">
            <h3 className="text-white text-sm font-medium line-clamp-1">
              {effectTitle}
            </h3>
          </div>
        </div>
      </Link>
    </div>
  );
}
