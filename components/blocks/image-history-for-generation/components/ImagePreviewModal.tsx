import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalImages?: number;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  prompt,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  currentIndex,
  totalImages,
}) => {
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (hasPrevious && onPrevious) {
            onPrevious();
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (hasNext && onNext) {
            onNext();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasPrevious, hasNext, onPrevious, onNext, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-8"
      onClick={onClose}
    >
      {/* Image counter */}
      {currentIndex !== undefined && totalImages !== undefined && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-3 py-1 rounded">
          {currentIndex + 1} / {totalImages}
        </div>
      )}

      {/* Previous button - no background shadow */}
      {hasPrevious && onPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors rounded-full p-3 z-10"
          title="Previous (←)"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Image */}
      <img
        src={imageUrl}
        alt={prompt}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next button - no background shadow */}
      {hasNext && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors rounded-full p-3 z-10"
          title="Next (→)"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Prompt */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl text-center text-white/80 text-sm bg-black/50 px-4 py-2 rounded">
        {prompt}
      </div>
    </div>
  );
};

export default ImagePreviewModal;