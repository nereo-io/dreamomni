import { VideoEffect } from "@/types/video-effect";

interface TechnicalSpecsProps {
  effect: VideoEffect;
}

export function TechnicalSpecs({ effect }: TechnicalSpecsProps) {
  if (!effect || !effect.content?.technicalSpecs) {
    return null;
  }

  const { effectDetails, outputSpecs } = effect.content.technicalSpecs;

  if (!effectDetails && !outputSpecs) {
    return null;
  }

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          Technical Specifications
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {effectDetails && (
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">
                Effect Details
              </h3>
              <ul className="space-y-3 text-gray-300">
                {Object.entries(effectDetails).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span className="text-purple-400 font-medium">
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {outputSpecs && (
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">
                Output Specifications
              </h3>
              <ul className="space-y-3 text-gray-300">
                {Object.entries(outputSpecs).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span className="text-purple-400 font-medium">
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}