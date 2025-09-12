"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIVideoShowcase as AIVideoShowcaseType } from "@/types/blocks/ai-video-showcase";
import { SectionHeader } from "@/components/blocks/section-header";

export function AIVideoShowcase({ data }: { data: AIVideoShowcaseType }) {
  const { title, description, cta, examples } = data;

  const [currentIndex, setCurrentIndex] = useState(1); // Start with middle item
  const [aspectRatio, setAspectRatio] = useState(16 / 9); // Default aspect ratio
  const [mediaLoadingStates, setMediaLoadingStates] = useState<
    Record<number, boolean>
  >({});
  const [mediaErrorStates, setMediaErrorStates] = useState<
    Record<number, boolean>
  >({});
  
  // Drag/swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  const finalTitle = title || "Visualize Any Text with Our AI Video Generator";
  const finalDescription =
    description ||
    "Bring any text to life with our AI video generator! Create engaging videos of any style with just a simple text prompt. Describe your ideas with a few words, and our video AI can visualize it creatively.";
  const buttonText = cta;

  const SWIPE_THRESHOLD = 50; // Minimum distance to trigger swipe
  const TRANSITION_DURATION = 300; // Animation duration in ms

  const handlePrevious = useCallback(() => {
    setIsTransitioning((transitioning) => {
      if (transitioning) return true;
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : examples.length - 1));
      setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION);
      return true;
    });
  }, [examples.length]);

  const handleNext = useCallback(() => {
    setIsTransitioning((transitioning) => {
      if (transitioning) return true;
      setCurrentIndex((prev) => (prev < examples.length - 1 ? prev + 1 : 0));
      setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION);
      return true;
    });
  }, [examples.length]);

  // Handle drag/swipe start
  const handleDragStart = useCallback((clientX: number) => {
    setIsTransitioning((transitioning) => {
      if (transitioning) return true;
      setIsDragging(true);
      setStartX(clientX);
      setCurrentX(clientX);
      return transitioning;
    });
  }, []);

  // Handle drag/swipe move
  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      setCurrentX(clientX);
      const diff = clientX - startX;
      setTranslateX(diff);
    },
    [isDragging, startX]
  );

  // Handle drag/swipe end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = currentX - startX;
    
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        // Swipe right - show previous
        handlePrevious();
      } else {
        // Swipe left - show next
        handleNext();
      }
    }
    
    // Reset translation
    setTranslateX(0);
    setStartX(0);
    setCurrentX(0);
  }, [isDragging, currentX, startX, handlePrevious, handleNext]);

  // Mouse events for desktop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleDragMove(e.clientX);
    },
    [handleDragMove]
  );

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, handleDragEnd]);

  // Touch events for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientX);
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleDragMove(e.touches[0].clientX);
    },
    [handleDragMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevious, handleNext]);

  // Calculate aspect ratio when media loads
  const handleMediaLoad = () => {
    const currentExample = examples[currentIndex];
    if (!currentExample) return;

    if (currentExample.image.endsWith(".mp4") && videoRef.current) {
      const video = videoRef.current;
      const ratio = video.videoWidth / video.videoHeight;
      setAspectRatio(ratio || 16 / 9);
    } else if (imageRef.current) {
      const img = imageRef.current;
      const ratio = img.naturalWidth / img.naturalHeight;
      setAspectRatio(ratio || 16 / 9);
    }
  };

  // Update aspect ratio when currentIndex changes
  useEffect(() => {
    // Reset to default and let media load event update it
    setAspectRatio(16 / 9);
  }, [currentIndex]);

  if (!examples || examples.length === 0) {
    return null;
  }

  // Video placeholder component - shown as background layer
  const VideoPlaceholder = ({ className }: { className?: string }) => (
    <div className={`${className} bg-muted flex items-center justify-center`}>
      <Film className="w-12 h-12 text-muted-foreground/50" />
    </div>
  );

  // Handle media load state
  const handleMediaLoadStart = (index: number) => {
    setMediaLoadingStates((prev) => ({ ...prev, [index]: true }));
    setMediaErrorStates((prev) => ({ ...prev, [index]: false }));
  };

  const handleMediaLoadComplete = (index: number) => {
    setMediaLoadingStates((prev) => ({ ...prev, [index]: false }));
  };

  const handleMediaError = (index: number) => {
    setMediaLoadingStates((prev) => ({ ...prev, [index]: false }));
    setMediaErrorStates((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="w-full py-16">
      <div className="mb-8 md:mb-12 px-4 md:px-0">
        <SectionHeader
          title={finalTitle}
          description={finalDescription}
          showButton={true}
          buttonText={buttonText}
          buttonHref="/text-to-video"
          centerAlign={true}
        />
      </div>

      {/* Desktop Layout */}
      <div 
        ref={containerRef}
        className="relative max-w-9xl mx-auto hidden md:block overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div 
          className="grid grid-cols-[1fr_3.5fr_1fr] gap-6 items-stretch transition-transform"
          style={{
            transform: `translateX(${translateX * 0.5}px)`,
            transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Previous Image */}
          <div className="opacity-50 transform scale-90 transition-all duration-300">
            <div className="relative w-full h-full overflow-hidden rounded-lg shadow-lg">
              {mediaErrorStates[
                (currentIndex - 1 + examples.length) % examples.length
              ] === true && (
                <VideoPlaceholder className="absolute inset-0 z-0" />
              )}
              {examples[
                (currentIndex - 1 + examples.length) % examples.length
              ]?.image.endsWith(".mp4") ? (
                <video
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                  src={
                    examples[
                      (currentIndex - 1 + examples.length) % examples.length
                    ]?.image || ""
                  }
                  onLoadStart={() =>
                    handleMediaLoadStart(
                      (currentIndex - 1 + examples.length) % examples.length
                    )
                  }
                  onLoadedData={() =>
                    handleMediaLoadComplete(
                      (currentIndex - 1 + examples.length) % examples.length
                    )
                  }
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  alt={
                    examples[
                      (currentIndex - 1 + examples.length) % examples.length
                    ]?.alt || ""
                  }
                  className="w-full h-full object-cover object-center"
                  src={
                    examples[
                      (currentIndex - 1 + examples.length) % examples.length
                    ]?.image || ""
                  }
                  onLoad={() =>
                    handleMediaLoadComplete(
                      (currentIndex - 1 + examples.length) % examples.length
                    )
                  }
                  onError={() =>
                    handleMediaError(
                      (currentIndex - 1 + examples.length) % examples.length
                    )
                  }
                />
              )}
            </div>
          </div>

          {/* Current Image */}
          <div className="z-0">
            <div 
              className="space-y-4 transition-opacity"
              style={{ opacity: isDragging ? 0.8 : 1 }}
            >
              {/* Video/Image */}
              <div className="relative">
                {mediaErrorStates[currentIndex] === true && (
                  <VideoPlaceholder className="absolute inset-0 z-0 rounded-xl border-2 border-border" />
                )}
                {examples[currentIndex]?.image.endsWith(".mp4") ? (
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="rounded-xl shadow-2xl border-2 border-border w-full object-cover select-none"
                    style={{ 
                      aspectRatio: aspectRatio,
                      pointerEvents: isDragging ? "none" : "auto"
                    }}
                    src={examples[currentIndex]?.image || ""}
                    onLoadStart={() => handleMediaLoadStart(currentIndex)}
                    onLoadedMetadata={(e) => {
                      handleMediaLoad();
                      handleMediaLoadComplete(currentIndex);
                    }}
                    draggable={false}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    ref={imageRef}
                    alt={examples[currentIndex]?.alt || ""}
                    className="rounded-xl shadow-2xl border-2 border-border w-full object-cover select-none"
                    style={{ 
                      aspectRatio: aspectRatio,
                      pointerEvents: isDragging ? "none" : "auto"
                    }}
                    src={examples[currentIndex]?.image || ""}
                    onLoad={(e) => {
                      handleMediaLoad();
                      handleMediaLoadComplete(currentIndex);
                    }}
                    onError={() => handleMediaError(currentIndex)}
                    draggable={false}
                  />
                )}
              </div>

              {/* Controls and Prompt Below */}
              <div className="bg-background/90 backdrop-blur-sm border border-border p-3 md:p-4 rounded-xl flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="default"
                  onClick={handlePrevious}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="text-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <p className="text-sm md:text-base text-foreground text-center px-3 line-clamp-2 font-medium select-none">
                  <span className="font-bold text-primary">Prompt:</span>{" "}
                  {examples[currentIndex]?.prompt || ""}
                </p>
                <Button
                  variant="ghost"
                  size="default"
                  onClick={handleNext}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="text-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Next Image */}
          <div className="opacity-50 transform scale-90 transition-all duration-300 relative">
            <div className="relative w-full h-full overflow-hidden rounded-lg shadow-lg">
              {mediaErrorStates[(currentIndex + 1) % examples.length] ===
                true && <VideoPlaceholder className="absolute inset-0 z-0" />}
              {examples[(currentIndex + 1) % examples.length]?.image.endsWith(
                ".mp4"
              ) ? (
                <video
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                  src={
                    examples[(currentIndex + 1) % examples.length]?.image || ""
                  }
                  onLoadStart={() =>
                    handleMediaLoadStart((currentIndex + 1) % examples.length)
                  }
                  onLoadedData={() =>
                    handleMediaLoadComplete(
                      (currentIndex + 1) % examples.length
                    )
                  }
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  alt={
                    examples[(currentIndex + 1) % examples.length]?.alt || ""
                  }
                  className="w-full h-full object-cover object-center"
                  src={
                    examples[(currentIndex + 1) % examples.length]?.image || ""
                  }
                  onLoad={() =>
                    handleMediaLoadComplete(
                      (currentIndex + 1) % examples.length
                    )
                  }
                  onError={() =>
                    handleMediaError((currentIndex + 1) % examples.length)
                  }
                />
              )}
              {examples[(currentIndex + 1) % examples.length]?.isNew && (
                <div className="absolute bottom-2 right-2 bg-primary rounded-full h-6 w-6 flex items-center justify-center text-primary-foreground text-xs font-bold z-20">
                  AI
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div 
        ref={mobileContainerRef}
        className="md:hidden overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="space-y-6">
          {/* Current Video/Image - Full width on mobile */}
          <div 
            className="w-full transition-transform"
            style={{
              transform: `translateX(${translateX}px)`,
              transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="space-y-4">
              <div className="relative">
                {mediaErrorStates[currentIndex] === true && (
                  <VideoPlaceholder className="absolute inset-0 z-0 rounded-xl border-2 border-border" />
                )}
                {examples[currentIndex]?.image.endsWith(".mp4") ? (
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="rounded-xl shadow-2xl border-2 border-border w-full object-cover select-none"
                    style={{ 
                      aspectRatio: aspectRatio,
                      pointerEvents: isDragging ? "none" : "auto"
                    }}
                    src={examples[currentIndex]?.image || ""}
                    onLoadStart={() => handleMediaLoadStart(currentIndex)}
                    onLoadedMetadata={(e) => {
                      handleMediaLoad();
                      handleMediaLoadComplete(currentIndex);
                    }}
                    draggable={false}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    ref={imageRef}
                    alt={examples[currentIndex]?.alt || ""}
                    className="rounded-xl shadow-2xl border-2 border-border w-full object-cover select-none"
                    style={{ 
                      aspectRatio: aspectRatio,
                      pointerEvents: isDragging ? "none" : "auto"
                    }}
                    src={examples[currentIndex]?.image || ""}
                    onLoad={(e) => {
                      handleMediaLoad();
                      handleMediaLoadComplete(currentIndex);
                    }}
                    onError={() => handleMediaError(currentIndex)}
                    draggable={false}
                  />
                )}
              </div>

              {/* Controls and Prompt Below */}
              <div className="bg-background/90 backdrop-blur-sm border border-border p-4 rounded-xl flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="default"
                  onClick={handlePrevious}
                  className="text-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <p className="text-sm text-foreground text-center px-3 line-clamp-2 font-medium">
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

          {/* Thumbnail Navigation */}
          <div className="flex justify-center space-x-2 overflow-x-auto pb-2">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 relative ${
                  index === currentIndex
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "opacity-60 hover:opacity-80"
                } transition-all duration-200`}
              >
                {example.image.endsWith(".mp4") ? (
                  <video
                    muted
                    playsInline
                    className="w-16 h-12 rounded-md object-cover"
                    src={example.image}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    alt={example.alt}
                    className="w-16 h-12 rounded-md object-cover"
                    src={example.image}
                  />
                )}
                {example.isNew && (
                  <div className="absolute -top-1 -right-1 bg-primary rounded-full h-4 w-4 flex items-center justify-center text-primary-foreground text-xs font-bold">
                    AI
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
