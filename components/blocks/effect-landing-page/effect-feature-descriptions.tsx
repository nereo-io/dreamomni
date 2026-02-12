"use client";

import { Button } from "@/components/ui/button";
import type { EffectMedia } from "@/types/blocks/effect-landing-page";

interface Feature {
  id?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  media?: EffectMedia;
}

interface EffectFeatureDescriptionsProps {
  features?: Feature[];
  ctaScrollTarget?: string;
}

export function EffectFeatureDescriptions({
  features,
  ctaScrollTarget = "[data-effect-tool]",
}: EffectFeatureDescriptionsProps) {
  const safeFeatures =
    features?.filter(
      (feature) =>
        Boolean(feature?.title || feature?.description || feature?.media?.src) &&
        (!feature?.media || Boolean(feature.media.type && feature.media.src))
    ) ?? [];

  if (safeFeatures.length === 0) return null;

  const handleCta = () => {
    const el = document.querySelector(ctaScrollTarget);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 md:py-20">
      <div className="space-y-16 md:space-y-24">
        {safeFeatures.map((feature, index) => {
          const isEven = index % 2 === 1;
          const media = feature.media;
          const hasMedia = Boolean(media?.type && media?.src);
          return (
            <div
              key={feature.id ?? `feature-${index}`}
              className={`grid grid-cols-1 gap-8 md:gap-12 items-center ${
                hasMedia ? "md:grid-cols-2" : ""
              }`}
            >
              {/* Text */}
              <div
                className={`flex flex-col ${
                  hasMedia && isEven ? "md:order-2" : "md:order-1"
                }`}
              >
                {feature.title && (
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                )}
                {feature.description && (
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    {feature.description}
                  </p>
                )}
                {feature.ctaText && (
                  <div>
                    <Button size="lg" onClick={handleCta}>
                      {feature.ctaText}
                    </Button>
                  </div>
                )}
              </div>

              {/* Media */}
              {media?.type && media?.src ? (
                <div
                  className={`relative rounded-2xl overflow-hidden ${
                    isEven ? "md:order-1" : "md:order-2"
                  }`}
                >
                  {media.type === "video" ? (
                    <video
                      className="w-full rounded-2xl"
                      src={media.src}
                      poster={media.poster}
                      autoPlay
                      loop
                      muted
                      playsInline
                      aria-label={media.alt || feature.title || "Feature media"}
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <img
                      className="w-full rounded-2xl"
                      src={media.src}
                      alt={media.alt || feature.title || "Feature media"}
                      loading="lazy"
                    />
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
