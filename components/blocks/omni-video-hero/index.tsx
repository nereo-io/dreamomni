"use client";

import { RainbowButton } from "@/components/ui/rainbow-button";
import { useInViewport } from "@/hooks/useInViewport";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

interface OmniVideoHeroProps {
  title: string;
  highlightText?: string;
  description: string;
  videoSrc: string;
  posterSrc: string;
}

export default function OmniVideoHero({
  title,
  highlightText,
  description,
  videoSrc,
  posterSrc,
}: OmniVideoHeroProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldAutoplay = useInViewport(sectionRef, { rootMargin: "0px" });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!shouldAutoplay) return;
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      try {
        video.load();
        await video.play();
      } catch {
        // Autoplay may be blocked; controls are available.
      }
    };

    tryPlay();
  }, [shouldAutoplay]);

  let texts: string[] | null = null;
  if (highlightText) {
    texts = title.split(highlightText, 2);
  }

  return (
    <section
      ref={sectionRef}
      className="w-full bg-slate-950 px-4 py-16 text-white sm:py-24"
    >
      <div className="mx-auto max-w-5xl text-center">
        {texts && texts.length > 1 ? (
          <h1 className="mx-auto mb-6 max-w-4xl text-balance text-4xl font-bold leading-tight lg:text-6xl">
            {texts[0]}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              {highlightText}
            </span>
            {texts[1]}
          </h1>
        ) : (
          <h1 className="mx-auto mb-6 max-w-4xl text-balance text-4xl font-bold leading-tight lg:text-6xl">
            {title}
          </h1>
        )}

        <p className="mx-auto mb-10 max-w-3xl text-lg text-gray-300 lg:text-xl">
          {description}
        </p>

        <div className="mb-12 flex items-center justify-center">
          <Link href="/omni-studio" className="inline-block">
            <RainbowButton>
              <Sparkles className="mr-2 h-5 w-5" />
              Free Gemini Omni
            </RainbowButton>
          </Link>
        </div>

        <div className="mx-auto max-w-4xl">
          <div
            className="relative w-full overflow-hidden rounded-2xl shadow-2xl"
            style={{ paddingBottom: "56.25%" }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full rounded-2xl object-cover"
              controls
              autoPlay={shouldAutoplay}
              muted
              loop
              playsInline
              poster={posterSrc}
              preload="none"
              onMouseEnter={() => {
                const v = videoRef.current;
                if (!v) return;
                v.muted = false;
                void v.play().catch(() => {});
              }}
              onMouseLeave={() => {
                const v = videoRef.current;
                if (v) v.muted = true;
              }}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
