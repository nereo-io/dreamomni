"use client";

import { useHasInteracted } from "@/hooks/useHasInteracted";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const HERO_POSTER_SRC = "/imgs/intro/veo-cover-202508-poster.webp";
const HERO_VIDEO_SRC = "https://r2.seedance.tv/intro/seedance2-documentary.mp4";

export default function HeroBg() {
  const hasInteracted = useHasInteracted();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPosterLoaded) return;
    if (shouldLoadVideo) return;

    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mediaQuery?.matches) return;

    const connection = (navigator as any).connection;
    if (connection?.saveData) return;

    if (hasInteracted) {
      setShouldLoadVideo(true);
      return;
    }

    const isMobile =
      window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches ===
      true;

    // Avoid auto-downloading the large hero video on mobile; it can hurt Lighthouse
    // and user-perceived performance. The video will still start after interaction.
    if (isMobile) return;

    const enableVideo = () => setShouldLoadVideo(true);
    const delayMs = 2000;

    const timeoutId = window.setTimeout(enableVideo, delayMs);

    const requestIdleCallback = (window as any).requestIdleCallback as
      | ((callback: () => void, options?: { timeout?: number }) => number)
      | undefined;
    const cancelIdleCallback = (window as any).cancelIdleCallback as
      | ((handle: number) => void)
      | undefined;

    const idleId = requestIdleCallback?.(enableVideo, { timeout: delayMs });

    return () => {
      window.clearTimeout(timeoutId);
      if (typeof idleId === "number") {
        cancelIdleCallback?.(idleId);
      }
    };
  }, [hasInteracted, isPosterLoaded, shouldLoadVideo]);

  useEffect(() => {
    if (!shouldLoadVideo) return;
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        // Autoplay may be blocked; controls aren't shown for this background video.
      }
    };

    video.load();
    tryPlay();
  }, [shouldLoadVideo]);

  return (
    <div className="absolute inset-0 -z-50 overflow-hidden">
      <Image
        src={HERO_POSTER_SRC}
        alt=""
        fill
        priority
        loading="eager"
        sizes="100vw"
        className="object-cover object-center"
        onLoad={() => setIsPosterLoaded(true)}
      />
      <video
        ref={videoRef}
        autoPlay={shouldLoadVideo}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{
          minWidth: "100%",
          minHeight: "100%",
          opacity: isVideoReady ? 1 : 0,
        }}
        onCanPlay={() => setIsVideoReady(true)}
        onError={() => setIsVideoReady(false)}
        poster={HERO_POSTER_SRC}
      >
        {shouldLoadVideo ? (
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        ) : null}
        Your browser does not support video playback.
      </video>
    </div>
  );
}
