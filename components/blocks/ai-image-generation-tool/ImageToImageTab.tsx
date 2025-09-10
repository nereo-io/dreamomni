"use client";

import ImageGenerationTab from "./ImageGenerationTab";

interface ImageToImageTabProps {
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
}

export default function ImageToImageTab({
  descriptionLabel,
  descriptionPlaceholder,
}: ImageToImageTabProps) {
  return (
    <ImageGenerationTab
      mode="image-to-image"
      descriptionLabel={descriptionLabel}
      descriptionPlaceholder={descriptionPlaceholder}
    />
  );
}