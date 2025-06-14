"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SeedanceFeaturesBlockTranslations } from "@/types/blocks/seedance-features";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface SeedanceFeaturesBlockProps {
  translations: SeedanceFeaturesBlockTranslations;
}

// Video mapping for each feature
const videoMapping: Record<string, string> = {
  "1080p-quality": "/intro/professional-1080.mp4",
  "multi-shot-storytelling": "/intro/storytelling.mp4",
  "style-versatility": "/intro/versatility.mp4",
  "complex-prompts": "/intro/prompt-understanding.mp4",
  "multi-agent-control": "/intro/camera.mp4",
  "wide-dynamic-range": "/intro/dynamic-range.mp4",
};

interface VideoPlayerProps {
  videoSrc: string;
}

function VideoPlayer({ videoSrc }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true); // 默认播放
  const [isMuted, setIsMuted] = useState(true); // 默认静音
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
    e.stopPropagation(); // 防止触发视频点击事件
    const video = document.getElementById(videoSrc) as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      className="relative w-full h-full group cursor-pointer"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleVideoClick}
    >
      <video
        id={videoSrc}
        className="w-full h-full object-cover rounded-lg"
        loop
        muted={isMuted}
        playsInline
        autoPlay
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Video overlay controls */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Play/Pause button - center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </div>
        </div>

        {/* Sound control button - bottom right */}
        <div className="absolute bottom-4 right-4">
          <button
            onClick={handleMuteToggle}
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SeedanceFeaturesBlock({
  translations,
}: SeedanceFeaturesBlockProps) {
  const { mainTitle, features } = translations;

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-muted/30 via-background to-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-foreground mb-10 md:mb-12 lg:mb-16">
          {mainTitle}
        </h2>
        <div className="space-y-12 md:space-y-16">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={cn(
                "flex flex-col rounded-xl overflow-hidden shadow-lg border border-border/40 backdrop-blur-sm",
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              )}
            >
              <div className="md:w-1/2 relative aspect-video bg-muted/50">
                {videoMapping[feature.id] ? (
                  <VideoPlayer videoSrc={videoMapping[feature.id]} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                    <span className="text-gray-500">Video not available</span>
                  </div>
                )}
              </div>
              <div className="md:w-1/2 p-6 md:p-8 lg:p-10 bg-card/90 backdrop-blur-sm">
                <h3 className="text-2xl md:text-3xl font-semibold text-card-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-6 text-base md:text-lg">
                  {feature.description}
                </p>
                {feature.subPoints && feature.subPoints.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {feature.subPoints.map((subPoint, subIndex) => (
                      <div key={subIndex}>
                        {subPoint.title && (
                          <h4 className="text-lg font-medium text-card-foreground/90 mb-1">
                            {subPoint.title}
                          </h4>
                        )}
                        <p className="text-muted-foreground text-sm md:text-base">
                          {subPoint.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {feature.buttonText && feature.buttonUrl && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <a href={feature.buttonUrl}>{feature.buttonText}</a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
