'use client';

import { RainbowButton } from "@/components/ui/rainbow-button";
import { FeatureHighlightsProps } from "@/types/blocks/feature-highlights";

export function FeatureHighlights({ data }: FeatureHighlightsProps) {
  if (!data || !data.features || data.features.length === 0) {
    return null;
  }

  const handleCTAClick = () => {
    const target = data.cta?.scrollTarget || "[data-video-generation-tool]";
    const toolElement = document.querySelector(target);
    if (toolElement) {
      toolElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        {data.title && (
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
            {data.title}
          </h2>
        )}

        <div className="space-y-16">
          {data.features.map((feature) => (
            <article
              key={feature.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8"
            >
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>

                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  {feature.description}
                </p>

                {feature.media && (
                  <div className="rounded-xl overflow-hidden">
                    {feature.media.type === "video" ? (
                      <video
                        className="w-full"
                        src={feature.media.src}
                        poster={feature.media.poster}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                        preload="metadata"
                        aria-label={feature.media.alt}
                      >
                        <track kind="captions" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        className="w-full"
                        src={feature.media.src}
                        alt={feature.media.alt}
                      />
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {data.cta && (
          <div className="flex justify-center mt-12">
            <RainbowButton onClick={handleCTAClick}>
              {data.cta.buttonText}
            </RainbowButton>
          </div>
        )}
      </div>
    </section>
  );
}
