"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ClaudeSonnetFeaturesBlockTranslations } from "@/types/blocks/claude-sonnet-features";
import { cn } from "@/lib/utils";

interface ClaudeSonnetFeaturesBlockProps {
  translations: ClaudeSonnetFeaturesBlockTranslations;
}

export default function ClaudeSonnetFeaturesBlock({
  translations,
}: ClaudeSonnetFeaturesBlockProps) {
  const { mainTitle, features } = translations;

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-10 md:mb-12 lg:mb-16">
          {mainTitle}
        </h2>
        <div className="space-y-12 md:space-y-16">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={cn(
                "flex flex-col rounded-xl overflow-hidden shadow-lg",
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              )}
            >
              <div className="md:w-1/2 relative aspect-video bg-gray-100">
                <Image
                  src={feature.imageUrl}
                  alt={feature.imageAlt}
                  layout="fill"
                  objectFit="contain"
                />
              </div>
              <div className="md:w-1/2 p-6 md:p-8 lg:p-10 bg-white">
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 text-base md:text-lg">
                  {feature.description}
                </p>
                {feature.subPoints && feature.subPoints.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {feature.subPoints.map((subPoint, subIndex) => (
                      <div key={subIndex}>
                        {subPoint.title && (
                          <h4 className="text-lg font-medium text-gray-700 mb-1">
                            {subPoint.title}
                          </h4>
                        )}
                        <p className="text-gray-600 text-sm md:text-base">
                          {subPoint.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {feature.buttonText && feature.buttonUrl && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <a href={feature.buttonUrl}>{feature.buttonText}</a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
