"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EffectCardProps {
  id: string;
  titleKey?: string;
  title?: string;
  image: string;
  video?: string;
  poster?: string;
  isHot?: boolean;
}

export function EffectCard({
  id,
  titleKey,
  title,
  image,
  video,
  poster,
  isHot,
}: EffectCardProps) {
  const t = useTranslations("effects");
  const tCommon = useTranslations("common");
  const displayTitle = titleKey ? t(titleKey as any) : title;
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && video) {
      videoRef.current.play().catch(() => {
        // Silently handle autoplay failures
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

  return (
    <div
      className="group relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
        <div className="aspect-video relative">
          {video ? (
            <video
              ref={videoRef}
              src={video}
              poster={poster || image}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={image || "/placeholder.svg"}
              alt={displayTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}

          {isHot && (
            <Badge className="absolute top-2 right-2 bg-red-600 hover:bg-red-600">
              Hot
            </Badge>
          )}

          {/* Hover overlay with "Use This Effect" button */}
          <div
            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <Link href={`/video-effects/${id}`}>
              <Button
                className="bg-white text-black hover:bg-gray-200 font-medium px-6 py-2"
                size="sm"
              >
                {tCommon("useThisEffect")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-white font-medium">{displayTitle}</h3>
        </div>
      </div>
    </div>
  );
}
