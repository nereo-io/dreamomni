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
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-muted/30 via-background to-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-foreground mb-10 md:mb-12 lg:mb-16">
          {mainTitle}
        </h2>
        <div className="space-y-12 md:space-y-16">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={cn(
                "flex flex-col rounded-xl overflow-hidden shadow-lg border border-border/40 backdrop-blur-sm",
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              )}
            >
              <div className="md:w-1/2 relative aspect-video bg-muted/50">
                <Image
                  src={feature.imageUrl}
                  alt={feature.imageAlt}
                  fill={true}
                  className="object-contain"
                />
              </div>
              <div className="md:w-1/2 p-6 md:p-8 lg:p-10 bg-card/90 backdrop-blur-sm">
                <h3 className="text-2xl md:text-3xl font-semibold text-card-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-6 text-base md:text-lg">
                  {feature.description}
                </p>
                {feature.subPoints && feature.subPoints.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {feature.subPoints.map((subPoint, subIndex) => (
                      <div key={subIndex}>
                        {subPoint.title && (
                          <h4 className="text-lg font-medium text-card-foreground/90 mb-1">
                            {subPoint.title}
                          </h4>
                        )}
                        <p className="text-muted-foreground text-sm md:text-base">
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
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
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
