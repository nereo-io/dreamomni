"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
} from "lucide-react";
import { VideoFeature } from "@/types/blocks/video-feature-showcase";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  feature: VideoFeature;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
}

export function VideoPlayer({
  feature,
  isPlaying,
  onPlayStateChange,
}: VideoPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideo = feature.demoVideos[currentVideoIndex];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const updateDuration = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [currentVideoIndex]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    onPlayStateChange(!isPlaying);
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoChange = (index: number) => {
    setCurrentVideoIndex(index);
    setProgress(0);
    onPlayStateChange(false);
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setProgress(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full aspect-video bg-black">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentVideo?.videoUrl}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        poster={currentVideo?.thumbnailUrl}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Video Controls Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300">
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="space-y-2">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30"
            >
              {feature.navLabel}
            </Badge>
            <h3 className="text-white font-semibold text-lg">
              {currentVideo?.title}
            </h3>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={handleMuteToggle}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={handleRestart}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            variant="secondary"
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 text-white border-white/30"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-4 right-4">
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-1 mb-4">
            <div
              className="bg-white h-1 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-white text-sm">
              {formatTime(videoRef.current?.currentTime || 0)} /{" "}
              {formatTime(duration)}
            </div>

            {/* Video Selection */}
            {feature.demoVideos.length > 1 && (
              <div className="flex gap-2">
                {feature.demoVideos.map((video, index) => (
                  <Button
                    key={video.id}
                    size="sm"
                    variant={
                      index === currentVideoIndex ? "default" : "secondary"
                    }
                    className={cn(
                      "text-xs px-2 py-1",
                      index === currentVideoIndex
                        ? "bg-white text-black"
                        : "bg-white/20 hover:bg-white/30 text-white border-white/30"
                    )}
                    onClick={() => handleVideoChange(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Description Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white text-sm leading-relaxed">
          {currentVideo?.description || feature.description}
        </p>
      </div>
    </div>
  );
}
