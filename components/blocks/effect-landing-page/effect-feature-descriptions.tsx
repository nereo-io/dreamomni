"use client";

import { Button } from "@/components/ui/button";
import type { EffectMedia } from "@/types/blocks/effect-landing-page";

interface Feature {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  media: EffectMedia;
}

interface EffectFeatureDescriptionsProps {
  features: Feature[];
  ctaScrollTarget?: string;
}

export function EffectFeatureDescriptions({
  features,
  ctaScrollTarget = "[data-effect-tool]",
}: EffectFeatureDescriptionsProps) {
  if (!features || features.length === 0) return null;

  const handleCta = () => {
    const el = document.querySelector(ctaScrollTarget);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 md:py-20">
      <div className="space-y-16 md:space-y-24">
        {features.map((feature, index) => {
          const isEven = index % 2 === 1;
          return (
            <div
              key={feature.id}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
            >
              {/* Text */}
              <div
                className={`flex flex-col ${
                  isEven ? "md:order-2" : "md:order-1"
                }`}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  {feature.description}
                </p>
                <div>
                  <Button size="lg" onClick={handleCta}>
                    {feature.ctaText}
                  </Button>
                </div>
              </div>

              {/* Media */}
              <div
                className={`relative rounded-2xl overflow-hidden ${
                  isEven ? "md:order-1" : "md:order-2"
                }`}
              >
                {feature.media.type === "video" ? (
                  <video
                    className="w-full rounded-2xl"
                    src={feature.media.src}
                    poster={feature.media.poster}
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-label={feature.media.alt || feature.title}
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <img
                    className="w-full rounded-2xl"
                    src={feature.media.src}
                    alt={feature.media.alt || feature.title}
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
