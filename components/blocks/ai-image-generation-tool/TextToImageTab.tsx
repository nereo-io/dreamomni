"use client";

import ImageGenerationTab from "./ImageGenerationTab";

interface TextToImageTabProps {
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
}

export default function TextToImageTab({
  descriptionLabel,
  descriptionPlaceholder,
}: TextToImageTabProps) {
  return (
    <ImageGenerationTab
      mode="text-to-image"
      descriptionLabel={descriptionLabel}
      descriptionPlaceholder={descriptionPlaceholder}
    />
  );
}
