"use client";

import { Button } from "@/components/ui/button";

interface Step {
  title: string;
  description: string;
}

interface EffectHowToUseProps {
  title: string;
  steps: Step[];
  ctaText: string;
  ctaScrollTarget?: string;
}

export function EffectHowToUse({
  title,
  steps,
  ctaText,
  ctaScrollTarget = "[data-effect-tool]",
}: EffectHowToUseProps) {
  if (!steps || steps.length === 0) return null;

  const handleCta = () => {
    const el = document.querySelector(ctaScrollTarget);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 md:py-20 text-center">
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-16">
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
          >
            <h3 className="text-2xl font-semibold text-white mb-4">
              {step.title}
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={handleCta}>{ctaText}</Button>
      </div>
    </section>
  );
}
