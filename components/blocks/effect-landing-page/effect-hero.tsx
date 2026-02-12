"use client";

import { Button } from "@/components/ui/button";
import type { EffectMedia } from "@/types/blocks/effect-landing-page";

interface EffectHeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaScrollTarget?: string;
  showcaseMedia: EffectMedia[];
}

export function EffectHero({
  title,
  subtitle,
  ctaText,
  ctaScrollTarget = "[data-effect-tool]",
  showcaseMedia,
}: EffectHeroProps) {
  const handleCta = () => {
    const el = document.querySelector(ctaScrollTarget);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-base md:text-lg text-gray-300 mb-8 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
        <div className="mb-12">
          <Button size="lg" onClick={handleCta}>{ctaText}</Button>
        </div>

        {showcaseMedia.length > 0 && (
          <div className="w-full">
            <div
              className={`grid gap-4 ${
                showcaseMedia.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              {showcaseMedia.map((media, index) => (
                <div
                  key={index}
                  className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-1"
                >
                  {media.type === "video" ? (
                    <video
                      className="w-full rounded-xl"
                      src={media.src}
                      poster={media.poster}
                      autoPlay
                      loop
                      muted
                      playsInline
                      aria-label={media.alt || "Showcase video"}
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <img
                      className="w-full rounded-xl"
                      src={media.src}
                      alt={media.alt || "Showcase image"}
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
