import { RainbowButton } from "@/components/ui/rainbow-button"
import { VideoEffect } from "@/types/video-effect"

interface HowToUseProps {
  effect: VideoEffect
}

export function HowToUse({ effect }: HowToUseProps) {
  if (!effect || !effect.content?.howToUse?.steps) {
    return null;
  }

  const steps = effect.content.howToUse.steps;

  return (
    <section className="py-20 px-6 text-center">
      <div className="max-w-6xl mx-auto">
        {/* Main heading */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-16 text-balance leading-tight">
          How to Use {effect.title}?
        </h2>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
            >
              <h3 className="text-2xl font-semibold text-white mb-4">{step.title}</h3>
              <p className="text-gray-300 text-lg leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {effect.content?.cta?.buttonText && (
          <div className="flex justify-center">
            <RainbowButton>
              {effect.content.cta.buttonText}
            </RainbowButton>
          </div>
        )}
      </div>
    </section>
  )
}