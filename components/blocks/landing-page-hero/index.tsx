"use client";

import { RainbowButton } from "@/components/ui/rainbow-button";
import { LandingPageHeroProps } from "@/types/blocks/landing-page-hero";

export function LandingPageHero({ data }: LandingPageHeroProps) {
  if (!data) {
    return null;
  }

  const handleCTAClick = () => {
    if (data.cta?.onClick) {
      data.cta.onClick();
    } else {
      const target = data.cta?.scrollTarget || "[data-video-generation-tool]";
      const toolElement = document.querySelector(target);
      if (toolElement) {
        toolElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <article className="relative overflow-hidden bg-gradient-to-b from-black to-gray-950 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <header>
            {data.badge && (
              <div className="flex justify-center mb-4">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {data.badge.text}
                </span>
              </div>
            )}

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {data.title}
            </h2>

            <p className="text-base md:text-lg text-gray-300 mb-8 leading-relaxed">
              {data.description}
            </p>
          </header>

          {data.cta && (
            <div className="flex justify-center mb-8">
              <RainbowButton onClick={handleCTAClick}>
                {data.cta.buttonText}
              </RainbowButton>
            </div>
          )}

          {data.media && (
            <section className="mb-12">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-1">
                {data.media.type === "video" ? (
                  <video
                    className="w-full rounded-xl"
                    src={data.media.src}
                    poster={data.media.poster}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    preload="metadata"
                    aria-label={data.media.alt || data.title}
                  >
                    <track kind="captions" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    className="w-full rounded-xl"
                    src={data.media.src}
                    alt={data.media.alt || data.title}
                  />
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
