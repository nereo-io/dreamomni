import React from "react";

interface ReferenceImagesThumbnailsProps {
  images: string[];
  onImageClick: (url: string, index: number) => void;
  maxDisplay?: number;
}

const ReferenceImagesThumbnails: React.FC<ReferenceImagesThumbnailsProps> = React.memo(
  ({ images, onImageClick, maxDisplay = 3 }) => {
    if (!images || images.length === 0) {
      return null;
    }

    const displayImages = images.slice(0, maxDisplay);
    const excess = Math.max(0, images.length - maxDisplay);

    return (
      <div className="flex-shrink-0 flex gap-1.5">
        {displayImages.map((url, index) => (
          <div
            key={index}
            className="h-12 w-12 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onImageClick(url, index)}
            title={`Click to view reference image ${index + 1}`}
          >
            <img
              src={url}
              alt={`Reference ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Excess images indicator */}
        {excess > 0 && (
          <div className="h-12 w-12 rounded bg-gray-600 flex items-center justify-center text-white text-xs font-bold cursor-default">
            +{excess}
          </div>
        )}
      </div>
    );
  }
);

ReferenceImagesThumbnails.displayName = "ReferenceImagesThumbnails";

export default ReferenceImagesThumbnails;
