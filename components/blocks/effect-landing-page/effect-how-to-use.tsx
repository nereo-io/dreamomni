"use client";

import { Button } from "@/components/ui/button";

interface Step {
  title?: string;
  description?: string;
}

interface EffectHowToUseProps {
  title?: string;
  steps?: Step[];
  ctaText?: string;
  ctaScrollTarget?: string;
}

export function EffectHowToUse({
  title,
  steps,
  ctaText,
  ctaScrollTarget = "[data-effect-tool]",
}: EffectHowToUseProps) {
  const safeSteps =
    steps?.filter((step) => Boolean(step?.title || step?.description)) ?? [];
  if (safeSteps.length === 0) return null;

  const handleCta = () => {
    const el = document.querySelector(ctaScrollTarget);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 md:py-20 text-center">
      {title && (
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-16">
          {title}
        </h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {safeSteps.map((step, index) => (
          <div
            key={index}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
          >
            {step.title && (
              <h3 className="text-2xl font-semibold text-white mb-4">
                {step.title}
              </h3>
            )}
            {step.description && (
              <p className="text-gray-300 text-lg leading-relaxed">
                {step.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {ctaText && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleCta}>{ctaText}</Button>
        </div>
      )}
    </section>
  );
}
