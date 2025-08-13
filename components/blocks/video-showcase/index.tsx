"use client";

import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { SHOWCASE_VIDEOS, type ShowcaseVideo } from "@/data/showcase-videos";
import ShowcaseCard from "./ShowcaseCard";

interface VideoShowcaseProps {
  onSelectVideo?: (video: ShowcaseVideo) => void;
}

export default function VideoShowcase({ onSelectVideo }: VideoShowcaseProps) {
  const [selectedVideo, setSelectedVideo] = useState<ShowcaseVideo>(SHOWCASE_VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle video selection
  const handleVideoSelect = (video: ShowcaseVideo) => {
    setSelectedVideo(video);
    setCurrentTime(0);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  // Handle create button click
  const handleCreate = (video: ShowcaseVideo) => {
    if (onSelectVideo) {
      onSelectVideo(video);
    }
  };

  // Handle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Scroll carousel
  const scrollCarousel = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 192; // Card width (180px) + gap (12px)
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === "left" 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth"
      });
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Upper Section - Video Player (Flexible Height) */}
      <div className="flex-1 min-h-0 flex flex-col bg-gray-900 rounded-t-2xl overflow-hidden">
        {/* Video Title Bar */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-gray-800">
          <h3 className="text-lg font-medium text-gray-300">Sample Video</h3>
        </div>

        {/* Video Container - Flexible with aspect ratio maintained */}
        <div className="flex-1 min-h-0 relative bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              src={selectedVideo.videoUrl}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              autoPlay
              loop
              muted
              playsInline
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />

            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress Bar */}
              <div className="w-full h-1 bg-gray-700 rounded-full mb-3">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${(currentTime / selectedVideo.duration) * 100}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayPause}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <span className="text-sm text-gray-300">
                    {formatTime(currentTime)} / {formatTime(selectedVideo.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="flex-shrink-0 px-6 py-2 border-t border-gray-800">
          <p className="text-xs text-gray-400">Prompt:</p>
          <p className="text-white text-xs line-clamp-2 mt-0.5">{selectedVideo.prompt}</p>
        </div>
      </div>

      {/* Lower Section - Video Carousel (Fixed at Bottom) */}
      <div className="flex-shrink-0 bg-gray-950 rounded-b-2xl py-3 px-3">
        <div className="relative">
          {/* Scroll Buttons */}
          <button
            onClick={() => scrollCarousel("left")}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-900/90 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollCarousel("right")}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-900/90 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Cards Container */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-6"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {SHOWCASE_VIDEOS.map((video) => (
              <ShowcaseCard
                key={video.id}
                video={video}
                isSelected={selectedVideo.id === video.id}
                onSelect={handleVideoSelect}
                onCreate={handleCreate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}