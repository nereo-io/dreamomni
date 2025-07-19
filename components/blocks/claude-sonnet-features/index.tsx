"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClaudeSonnetFeaturesBlockTranslations } from "@/types/blocks/claude-sonnet-features";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface ClaudeSonnetFeaturesBlockProps {
  translations: ClaudeSonnetFeaturesBlockTranslations;
}

// Video mapping for each feature
const videoMapping: Record<string, string> = {
  "1080p-quality": `/intro/professional-1080.mp4`,
  "multi-shot-storytelling": `/intro/storytelling.mp4`,
  "style-versatility": `/intro/versatility.mp4`,
  "prompt-understanding": `/intro/prompt-understanding.mp4`,
  "camera-control": `/intro/camera.mp4`,
  "dynamic-range": `/intro/dynamic-range.mp4`,
};

interface VideoPlayerProps {
  videoSrc: string;
}

function VideoPlayer({ videoSrc }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const handleVideoClick = () => {
    const video = document.getElementById(videoSrc) as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = document.getElementById(videoSrc) as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden cursor-pointer group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleVideoClick}
    >
      <video
        id={videoSrc}
        className="w-full h-full object-cover"
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Video Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black/20 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full w-12 h-12 bg-white/80 hover:bg-white/90 text-black"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mute Button */}
        <div className="absolute bottom-4 right-4">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full w-10 h-10 bg-white/80 hover:bg-white/90 text-black"
            onClick={handleMuteToggle}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ClaudeSonnetFeaturesBlock({
  translations,
}: ClaudeSonnetFeaturesBlockProps) {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto px-4">
        {/* Main Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {translations.mainTitle}
          </h2>
        </div>

        {/* Features Grid */}
        <div className="space-y-24">
          {translations.features.map((feature, index) => (
            <div
              key={feature.id}
              className={cn(
                "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
                index % 2 === 1 && "lg:grid-flow-col-dense"
              )}
            >
              {/* Content */}
              <div
                className={cn(
                  "space-y-6",
                  index % 2 === 1 && "lg:col-start-2"
                )}
              >
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Sub Points */}
                {feature.subPoints && (
                  <div className="space-y-4">
                    {feature.subPoints.map((point, pointIndex) => (
                      <div key={pointIndex} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {point.title}
                        </h4>
                        <p className="text-gray-600">{point.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Button */}
                {feature.buttonText && feature.buttonUrl && (
                  <div className="pt-4">
                    <Button
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                      asChild
                    >
                      <a href={feature.buttonUrl}>{feature.buttonText}</a>
                    </Button>
                  </div>
                )}
              </div>

              {/* Video */}
              <div className={cn(index % 2 === 1 && "lg:col-start-1")}>
                <VideoPlayer
                  videoSrc={videoMapping[feature.id] || feature.imageUrl}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}