"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Play, Lock, Sparkles } from "lucide-react";
import type { EffectConfig } from "@/models/effectConfig";

interface VideoEffectsClientProps {
  effects: EffectConfig[];
}

const categories = [
  "All",
  "Interaction",
  "Appearance",
  "Emotions",
  "Entertainment",
  "Horror/Fantasy",
];

export default function VideoEffectsClient({ effects }: VideoEffectsClientProps) {
  const locale = useLocale();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [hoveredEffect, setHoveredEffect] = useState<string | null>(null);

  // 过滤特效
  const filteredEffects = selectedCategory === "All" 
    ? effects 
    : effects.filter(effect => effect.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category
                ? "bg-blue-500 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredEffects.map((effect) => {
          const title = effect.title[locale] || effect.title.en;
          const description = effect.description[locale] || effect.description.en;
          
          return (
            <Link
              key={effect.id}
              href={`/${locale}/video-effects/${effect.slug}`}
              className="group relative bg-gray-800 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
              onMouseEnter={() => setHoveredEffect(effect.id)}
              onMouseLeave={() => setHoveredEffect(null)}
            >
              {/* Preview Image/Video */}
              <div className="relative aspect-video overflow-hidden bg-gray-900">
                {hoveredEffect === effect.id && effect.preview_video ? (
                  <video
                    src={effect.preview_video}
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={effect.preview_image || effect.poster_image || "/placeholder.jpg"}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-900 ml-1" />
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {effect.is_hot && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      HOT
                    </span>
                  )}
                  {!effect.is_free && (
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Premium
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
                  {title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2">
                  {description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEffects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No effects found in this category.</p>
        </div>
      )}
    </div>
  );
}