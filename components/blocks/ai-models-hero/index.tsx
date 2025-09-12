"use client";

import { AIModelsHero as AIModelsHeroData } from "@/types/blocks/ai-model-hero";

interface AIModelsHeroProps {
  data: AIModelsHeroData;
  title?: string;
  description?: string;
}

export function AIModelsHero({ data, title, description }: AIModelsHeroProps) {
  const finalTitle = title || data?.title;
  const finalDescription = description || data?.description;

  return (
    <div className="w-full bg-gray-900 py-16">
      <div className="max-w-6xl mx-auto px-4 text-center">
        {/* Title */}
        <h2 className="text-xl md:text-3xl font-bold text-white mb-6">
          {finalTitle}
        </h2>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
          {finalDescription}
        </p>

        {/* Models Grid */}
        <div className="flex justify-center items-center gap-8 mb-12">
          {data?.models?.map((model) => (
            <div key={model.id} className="flex flex-col items-center">
              {/* Model Logo */}
              <div className="bg-gray-800 border border-gray-700 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-3 shadow-lg p-3 hover:bg-gray-750 transition-colors">
                <img
                  src={model.logo}
                  alt={`${model.name} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
              {/* Model Name */}
              <span className="text-white text-sm md:text-base font-medium">
                {model.name}
              </span>
            </div>
          ))}

          {/* More Models Coming Soon */}
          <div className="flex flex-col items-center">
            <div className="bg-gray-800 border border-gray-700 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-3 shadow-lg border-2 border-dashed border-gray-500">
              <span className="text-gray-400 text-xl md:text-2xl">+</span>
            </div>
            <span className="text-gray-400 text-sm md:text-base font-medium">
              {data?.moreModels}
            </span>
          </div>
        </div>

        {/* Video Display Area */}
        <div className="max-w-4xl mx-auto">
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
            style={{ paddingBottom: "56.25%" }}
          >
            <video
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              controls
              autoPlay
              muted
              loop
              playsInline
              poster="/imgs/intro/veo-cover-202508-poster.jpg"
            >
              <source
                src="https://r2.veo3ai.io/intro/cover-video.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
      </div>
    </div>
  );
}
