'use client';

import { RainbowButton } from "@/components/ui/rainbow-button";
import { VideoEffect } from "@/types/video-effect";

interface VideoEffectHeroProps {
  effect: VideoEffect;
  onTryEffect?: () => void;
}

export function VideoEffectHero({ effect, onTryEffect }: VideoEffectHeroProps) {
  if (!effect) {
    return null;
  }

  const handleTryEffect = () => {
    if (onTryEffect) {
      onTryEffect();
    } else {
      // Default behavior: scroll to video generation tool
      const toolElement = document.querySelector(
        "[data-video-generation-tool]"
      );
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {effect.title}
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-8 leading-relaxed">
              {effect.page_description}
            </p>
          </header>

          {/* Try Effect Button */}
          {effect.content?.cta?.buttonText && (
            <div className="flex justify-center mb-8">
              <RainbowButton onClick={handleTryEffect}>
                {effect.content.cta.buttonText}
              </RainbowButton>
            </div>
          )}

          {/* Preview Video */}
          {effect.preview_video && (
            <section className="mb-12">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-1">
                <video
                  className="w-full rounded-xl"
                  src={effect.preview_video}
                  poster={effect.preview_image || undefined}
                  controls
                  preload="metadata"
                  aria-label={`Preview of ${effect.title} video effect`}
                >
                  <track kind="captions" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </section>
          )}

        </div>
      </div>
    </article>
  );
}
