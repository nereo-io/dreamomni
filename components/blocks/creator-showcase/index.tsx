"use client";

import { useState } from "react";
import { CreatorShowcase as CreatorShowcaseData } from "@/types/pages/text-to-video";

interface CreatorShowcaseProps {
  data: CreatorShowcaseData;
  title?: string;
}

export function CreatorShowcase({ data, title }: CreatorShowcaseProps) {
  const [activeTab, setActiveTab] = useState(0);

  const finalTitle = title || data.title;
  const creatorTypes = data.creatorTypes;
  const activeCreator = creatorTypes[activeTab];

  return (
    <div className="w-full py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
          {finalTitle}
        </h2>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 border-b border-border overflow-x-auto">
          <div className="flex space-x-0 min-w-max">
            {creatorTypes.map((creator, index) => (
              <button
                key={creator.id}
                onClick={() => setActiveTab(index)}
                className={`px-4 md:px-6 py-3 text-sm md:text-lg font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === index
                    ? "text-foreground border-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                {creator.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Image */}
          <div className="w-full md:w-1/2">
            <img
              alt={activeCreator.imageAlt}
              className="rounded-lg w-full h-64 md:h-80 object-cover"
              src={activeCreator.image}
            />
          </div>

          {/* Content */}
          <div className="w-full md:w-1/2">
            <span className="inline-block bg-secondary text-secondary-foreground text-xs md:text-sm font-medium px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-4">
              {activeCreator.badge}
            </span>
            <h3 className="text-2xl md:text-4xl font-bold mb-4 leading-tight text-foreground">
              {activeCreator.title}
            </h3>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              {activeCreator.description}
            </p>
          </div>
        </div>

        {/* Mobile Dots Indicator */}
        <div className="flex justify-center mt-6 space-x-2 md:hidden">
          {creatorTypes.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === activeTab ? "bg-primary" : "bg-muted"
              }`}
              aria-label={`Go to ${creatorTypes[index].name}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}