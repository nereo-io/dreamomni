"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRef, useState } from "react";
import { VideoEffect } from "@/types/effects";
import { effects, categoryEffects } from "@/data/effects";

export function VideoEffectsGrid() {
  const tEffects = useTranslations("effects");
  const t = useTranslations("pages.videoAffects");

  // Combine all effects into a single array
  const allEffects: VideoEffect[] = [
    ...effects,
    ...Object.values(categoryEffects).flat(),
  ];

  // Remove duplicates based on id
  const uniqueEffects = allEffects.filter(
    (effect, index, self) => index === self.findIndex((e) => e.id === effect.id)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {uniqueEffects.map((effect) => (
        <VideoEffectCard key={effect.id} effect={effect} />
      ))}
    </div>
  );
}

function VideoEffectCard({ effect }: { effect: VideoEffect }) {
  const tEffects = useTranslations("effects");
  const t = useTranslations("pages.videoAffects");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const effectTitle = effect.titleKey
    ? tEffects(effect.titleKey as any)
    : effect.title || "Unknown Effect";

  // Generate realistic usage count (can be replaced with real data later)
  const usageCount = generateUsageCount(effect.id);
  const formattedCount = formatUsageCount(usageCount);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && isVideoLoaded) {
      videoRef.current.play().catch(() => {
        // Ignore autoplay errors
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

  const effectUrl = effect.id.startsWith("template/")
    ? `/${effect.id}`
    : `/template/${effect.id}`;

  return (
    <div className="group relative max-w-[290px] mx-auto">
      {/* Gradient border effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C721FF] via-[#FF3466] to-[#FF8A00] transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} p-[2px]`}>
        <div className="w-full h-full rounded-2xl bg-gray-900"></div>
      </div>
      
      <Link
        href={effectUrl}
        className="relative block aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-transparent transition-all duration-300"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900">
          {/* Video background */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${effect.poster || effect.image})` }}
          />
          
          <video
            ref={videoRef}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            poster={effect.poster || effect.image}
            src={effect.video}
            loop
            muted
            playsInline
            preload="none"
            onLoadedData={handleVideoLoadedData}
          />

          {/* Hot badge - top left */}
          {effect.isHot && (
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/20">
                HOT
              </div>
            </div>
          )}

          {/* Usage count - top right */}
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full border border-white/20">
              {formattedCount}
            </div>
          </div>

          {/* Hover overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {/* Use effect button - center bottom */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <button className="bg-gradient-to-r from-[#C721FF] to-[#FF3466] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 transform hover:scale-105 whitespace-nowrap">
                {t("useThisEffect")}
              </button>
            </div>
          </div>

          {/* Title overlay - bottom when not hovering */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            <p className="text-white text-sm font-medium truncate">{effectTitle}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Generate realistic usage count based on effect ID
function generateUsageCount(id: string): number {
  // Create a deterministic seed from the effect ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Generate a number between 1000 and 50000 based on the hash
  const min = 1000;
  const max = 50000;
  const count = min + (Math.abs(hash) % (max - min));
  
  return count;
}

// Format usage count to display like "25.7K", "1.2M", etc.
function formatUsageCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  } else {
    return count.toString();
  }
}