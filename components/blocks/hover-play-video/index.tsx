"use client";

import { useRef } from "react";

interface HoverPlayVideoProps {
  src: string;
  className?: string;
  poster?: string;
  ariaLabel?: string;
}

/**
 * Video that auto-plays with sound on hover (desktop) and pauses + mutes on
 * leave. Mobile/touch users still get native controls to play manually.
 */
export default function HoverPlayVideo({
  src,
  className,
  poster,
  ariaLabel,
}: HoverPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    void video.play().catch(() => {
      // Playing with sound may be blocked by the browser; ignore.
    });
  };

  const handleMouseLeave = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.muted = true;
  };

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      className={className}
      controls
      muted
      playsInline
      preload="metadata"
      aria-label={ariaLabel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
}
