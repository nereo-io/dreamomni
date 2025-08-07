"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageToVideoShowcase as ImageToVideoShowcaseData } from "@/types/blocks/image-to-video-showcase";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/blocks/section-header";

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const startTimeRef = useRef(0);

  const finalTitle = title || data.title;
  const finalDescription = description || data.description;
  const buttonText = data.cta;
  const examples = data.examples;

  const handlePrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : examples.length - 1));
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, examples.length]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev < examples.length - 1 ? prev + 1 : 0));
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, examples.length]);

  const handleDotClick = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // 处理滑动逻辑
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      handleNext();
    } else {
      handlePrevious();
    }
  }, [handleNext, handlePrevious]);

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    startTimeRef.current = Date.now();
    isDraggingRef.current = true;
  }, [isTransitioning]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    
    const touch = e.changedTouches[0];
    const endPos = { x: touch.clientX, y: touch.clientY };
    const deltaX = endPos.x - startPosRef.current.x;
    const deltaY = endPos.y - startPosRef.current.y;
    const deltaTime = Date.now() - startTimeRef.current;
    
    // 检查是否是有效的滑动手势
    const minSwipeDistance = 50;
    const maxSwipeTime = 500;
    const maxVerticalDistance = 100;
    
    if (
      Math.abs(deltaX) > minSwipeDistance &&
      Math.abs(deltaY) < maxVerticalDistance &&
      deltaTime < maxSwipeTime
    ) {
      handleSwipe(deltaX > 0 ? 'right' : 'left');
    }
  }, [handleSwipe]);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isTransitioning) return;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startTimeRef.current = Date.now();
    isDraggingRef.current = true;
    e.preventDefault();
  }, [isTransitioning]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    
    const endPos = { x: e.clientX, y: e.clientY };
    const deltaX = endPos.x - startPosRef.current.x;
    const deltaY = endPos.y - startPosRef.current.y;
    const deltaTime = Date.now() - startTimeRef.current;
    
    // 检查是否是有效的拖拽手势
    const minDragDistance = 50;
    const maxDragTime = 500;
    const maxVerticalDistance = 100;
    
    if (
      Math.abs(deltaX) > minDragDistance &&
      Math.abs(deltaY) < maxVerticalDistance &&
      deltaTime < maxDragTime
    ) {
      handleSwipe(deltaX > 0 ? 'right' : 'left');
    }
  }, [handleSwipe]);

  if (!examples || examples.length === 0) {
    return null;
  }

  const currentExample = examples[currentIndex];

  return (
    <div className="w-full py-12 md:py-16 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8 md:mb-12 px-4">
          <SectionHeader
            title={finalTitle}
            description={finalDescription}
            showButton={true}
            buttonText={buttonText}
            buttonHref="/image-to-video"
            centerAlign={true}
          />
        </div>

        {/* Mobile Layout */}
        <div 
          className="md:hidden px-4"
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ touchAction: 'pan-y' }}
        >
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Input Section: Image + Prompt */}
            <div
              className={cn(
                "transform transition-all duration-500",
                isTransitioning
                  ? "scale-95 opacity-50"
                  : "scale-100 opacity-100"
              )}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-xl" />
                <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
                  <div className="flex">
                    {/* Image Section */}
                    <div className="w-[45%] p-3 border-r border-border/30">
                      <div className="mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {data.labels.originalImage}
                        </span>
                      </div>
                      <div className="relative overflow-hidden rounded-xl bg-black/5">
                        <img
                          alt={currentExample.originalAlt}
                          className="w-full h-full object-contain aspect-square"
                          src={currentExample.originalImage}
                        />
                      </div>
                    </div>

                    {/* Prompt Section */}
                    <div className="flex-1 p-3 flex flex-col">
                      <div className="mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {data.labels.prompt}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed flex-1 flex items-center">
                        {currentExample.prompt}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Arrow */}
            <div className="flex justify-center py-2">
              <ArrowRight className="w-8 h-8 text-primary/60 rotate-90" />
            </div>

            {/* Video Output Section */}
            <div
              className={cn(
                "transform transition-all duration-500 delay-100",
                isTransitioning
                  ? "scale-95 opacity-50"
                  : "scale-100 opacity-100"
              )}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-3xl blur-xl" />
                <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl p-4 shadow-2xl border border-border/50">
                  <div className="mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {data.labels.video}
                    </span>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl bg-black/5">
                    <video
                      controls
                      loop
                      muted
                      autoPlay
                      playsInline
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: "60vh" }}
                      src={currentExample.videoImage}
                      aria-label={currentExample.videoAlt}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div 
          className="hidden md:block relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y', userSelect: 'none' }}
        >
          <div className="flex items-center justify-center gap-6 px-6">
            {/* Left Navigation Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 shadow-lg transition-all hover:scale-110"
              disabled={isTransitioning}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            {/* Main Content */}
            <div className="flex items-center gap-8 relative">
              {/* Original Image Section */}
              <div
                className={cn(
                  "transform transition-all duration-500",
                  isTransitioning
                    ? "scale-95 opacity-50"
                    : "scale-100 opacity-100"
                )}
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
                  <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-border/50">
                    <div className="mb-6">
                      <span className="text-base font-medium text-muted-foreground">
                        {data.labels.originalImage}
                      </span>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl mb-6 bg-black/5">
                      <img
                        alt={currentExample.originalAlt}
                        className="w-[360px] max-h-[360px] object-contain"
                        src={currentExample.originalImage}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Prompt integrated below image */}
                    <div className="bg-muted/50 rounded-2xl p-4">
                      <div className="mb-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          {data.labels.prompt}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed">
                        {currentExample.prompt}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Arrow */}
              <div className="flex items-center">
                <ArrowRight className="w-10 h-10 text-primary/60" />
              </div>

              {/* Video Result Section */}
              <div
                className={cn(
                  "transform transition-all duration-500 delay-100",
                  isTransitioning
                    ? "scale-95 opacity-50"
                    : "scale-100 opacity-100"
                )}
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
                  <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-border/50">
                    <div className="mb-6">
                      <span className="text-base font-medium text-muted-foreground">
                        {data.labels.video}
                      </span>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl bg-black/5">
                      <video
                        controls
                        loop
                        muted
                        autoPlay
                        playsInline
                        className="w-[640px] h-[400px] object-contain"
                        src={currentExample.videoImage}
                        aria-label={currentExample.videoAlt}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Navigation Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 shadow-lg transition-all hover:scale-110"
              disabled={isTransitioning}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center mt-8 gap-2">
          {examples.map((_, index: number) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-8 bg-gradient-to-r from-primary to-secondary"
                  : "w-2 bg-muted hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to example ${index + 1}`}
              disabled={isTransitioning}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
