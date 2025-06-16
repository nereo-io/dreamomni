"use client";

import { useState } from "react";
import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

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
        className="w-full h-full object-cover rounded-md"
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

export default function Feature1({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  // 检查是否有视频源 (支持.mp4文件)
  const isVideo = section.image?.src?.endsWith(".mp4");

  return (
    <section id={section.name} className="py-16">
      <div className="container">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          {section.youtubeUrl ? (
            <div className="w-full h-full aspect-video rounded-md overflow-hidden">
              <iframe
                src={section.youtubeUrl}
                title="YouTube video"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : section.image?.src ? (
            <div className="w-full aspect-[9/16]">
              {isVideo ? (
                <VideoPlayer videoSrc={section.image.src} />
              ) : (
                <img
                  src={section.image.src}
                  alt="placeholder hero"
                  className="max-h-full w-full rounded-md object-cover"
                />
              )}
            </div>
          ) : null}
          <div className="flex flex-col lg:text-left">
            {section.title && (
              <h2 className="mb-6 text-pretty text-3xl font-bold lg:text-4xl">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="mb-8 max-w-xl text-muted-foreground lg:max-w-none lg:text-lg">
                {section.description}
              </p>
            )}
            <ul className="flex flex-col justify-center gap-y-8">
              {section.items?.map((item, i) => (
                <li key={i} className="flex">
                  {item.icon && (
                    <Icon
                      name={item.icon}
                      className="mr-2 size-6 shrink-0 lg:mr-2 lg:size-6"
                    />
                  )}
                  <div>
                    <div className="mb-3 h-5 text-sm font-semibold text-accent-foreground md:text-base">
                      {item.title}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground md:text-base">
                      {item.description}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
