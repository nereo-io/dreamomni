"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIVideoShowcase as AIVideoShowcaseType, VideoExample } from "@/types/blocks/ai-video-showcase";

interface AIVideoShowcaseProps extends AIVideoShowcaseType {}

export function AIVideoShowcase({
  title,
  description,
  examples,
}: AIVideoShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(1); // Start with middle item

  const finalTitle = title || "Visualize Any Text with Our AI Video Generator";
  const finalDescription = description || "Bring any text to life with our AI video generator! Create engaging videos of any style with just a simple text prompt. Describe your ideas with a few words, and our video AI can visualize it creatively.";

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : examples.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < examples.length - 1 ? prev + 1 : 0));
  };

  if (!examples || examples.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-16">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-4xl font-bold mb-6 text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {finalTitle}
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto font-medium leading-relaxed">
          {finalDescription}
        </p>
      </div>

      <div className="relative max-w-9xl mx-auto">
        <div className="flex items-center justify-center space-x-3 md:space-x-6">
          {/* Previous Image */}
          <div className="w-1/4 opacity-50 transform scale-90 md:scale-100 transition-all duration-300">
            {examples[(currentIndex - 1 + examples.length) % examples.length]?.image.endsWith('.mp4') ? (
              <video
                muted
                loop
                playsInline
                className="rounded-lg shadow-lg w-full h-32 md:h-40 object-cover"
                src={
                  examples[(currentIndex - 1 + examples.length) % examples.length]
                    ?.image || ""
                }
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                alt={
                  examples[(currentIndex - 1 + examples.length) % examples.length]
                    ?.alt || ""
                }
                className="rounded-lg shadow-lg w-full h-32 md:h-40"
                src={
                  examples[(currentIndex - 1 + examples.length) % examples.length]
                    ?.image || ""
                }
              />
            )}
          </div>

          {/* Current Image */}
          <div className="w-2/4 z-10">
            <div className="space-y-4">
              {/* Video/Image */}
              <div className="relative">
                {examples[currentIndex]?.image.endsWith('.mp4') ? (
                  <video
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="rounded-xl shadow-2xl border-2 border-border w-full h-56 md:h-72 lg:h-80 object-cover"
                    src={examples[currentIndex]?.image || ""}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    alt={examples[currentIndex]?.alt || ""}
                    className="rounded-xl shadow-2xl border-2 border-border w-full h-56 md:h-72 lg:h-80"
                    src={examples[currentIndex]?.image || ""}
                  />
                )}
              </div>
              
              {/* Controls and Prompt Below */}
              <div className="bg-background/90 backdrop-blur-sm border border-border p-3 md:p-4 rounded-xl flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="default"
                  onClick={handlePrevious}
                  className="text-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <p className="text-sm md:text-base text-foreground text-center px-3 line-clamp-2 font-medium">
                  <span className="font-bold text-primary">Prompt:</span>{" "}
                  {examples[currentIndex]?.prompt || ""}
                </p>
                <Button
                  variant="ghost"
                  size="default"
                  onClick={handleNext}
                  className="text-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Next Image */}
          <div className="w-1/4 opacity-50 transform scale-90 md:scale-100 transition-all duration-300 relative">
            {examples[(currentIndex + 1) % examples.length]?.image.endsWith('.mp4') ? (
              <video
                muted
                loop
                playsInline
                className="rounded-lg shadow-lg w-full h-32 md:h-40 object-cover"
                src={examples[(currentIndex + 1) % examples.length]?.image || ""}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                alt={examples[(currentIndex + 1) % examples.length]?.alt || ""}
                className="rounded-lg shadow-lg w-full h-32 md:h-40"
                src={examples[(currentIndex + 1) % examples.length]?.image || ""}
              />
            )}
            {examples[(currentIndex + 1) % examples.length]?.isNew && (
              <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-primary rounded-full h-6 w-6 md:h-8 md:w-8 flex items-center justify-center text-primary-foreground text-xs font-bold">
                AI
              </div>
            )}
          </div>
        </div>

        {/* Dot indicators for mobile */}
        <div className="flex justify-center mt-6 space-x-2 md:hidden">
          {examples.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
