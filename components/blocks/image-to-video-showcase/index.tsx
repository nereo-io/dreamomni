"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageToVideoShowcase as ImageToVideoShowcaseData } from "@/types/pages/image-to-video";

interface ImageToVideoShowcaseProps {
  data: ImageToVideoShowcaseData;
  title?: string;
  description?: string;
}

export function ImageToVideoShowcase({
  data,
  title,
  description,
}: ImageToVideoShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const finalTitle = title || data.title;
  const finalDescription = description || data.description;
  const examples = data.examples;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : examples.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < examples.length - 1 ? prev + 1 : 0));
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (!examples || examples.length === 0) {
    return null;
  }

  const currentExample = examples[currentIndex];

  return (
    <div className="w-full py-12">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold mb-4 text-foreground">
          {finalTitle}
        </h2>
        <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
          {finalDescription}
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mt-8 max-w-8xl mx-auto px-4">
        {/* Left Navigation Button */}
        <div className="flex items-center justify-center w-full md:w-auto order-1 md:order-1">
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePrevious}
            className="bg-card hover:bg-muted p-4 rounded-full transition-colors text-foreground hover:text-primary shadow-md hover:shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>

        {/* Content Container */}
        <div className="flex flex-col items-center gap-4 w-full max-w-lg order-3 md:order-2">
          {/* Original Image */}
          <div className="bg-card/50 backdrop-blur-sm border border-border p-3 rounded-lg w-full">
            <p className="text-sm text-muted-foreground mb-2">
              {data.labels.originalImage}
            </p>
            <img
              alt={currentExample.originalAlt}
              className="rounded-md w-full object-cover aspect-square"
              src={currentExample.originalImage}
            />
          </div>

          {/* Prompt */}
          <div className="bg-card/50 backdrop-blur-sm border border-border p-3 rounded-lg w-full">
            <p className="text-sm text-muted-foreground mb-2">
              {data.labels.prompt}
            </p>
            <p className="text-foreground text-sm md:text-base">
              {currentExample.prompt}
            </p>
          </div>
        </div>

        {/* Arrow - Hidden on mobile */}
        <div className="text-primary text-4xl hidden md:flex items-center justify-center order-4 md:order-3">
          <ArrowRight className="h-8 w-8" />
        </div>

        {/* Video Result */}
        <div className="bg-card/50 backdrop-blur-sm border border-border p-3 rounded-lg w-full max-w-3xl relative order-2 md:order-4">
          <p className="text-sm text-muted-foreground mb-2">
            {data.labels.video}
          </p>
          <video
            controls
            loop
            muted
            autoPlay
            playsInline
            className="rounded-md w-full object-cover aspect-square"
            src={currentExample.videoImage}
            aria-label={currentExample.videoAlt}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Right Navigation Button */}
        <div className="flex items-center justify-center w-full md:w-auto order-5">
          <Button
            variant="ghost"
            size="lg"
            onClick={handleNext}
            className="bg-card hover:bg-muted p-4 rounded-full transition-colors text-foreground hover:text-primary shadow-md hover:shadow-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {examples.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex ? "bg-primary" : "bg-muted"
            }`}
            aria-label={`Go to example ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
