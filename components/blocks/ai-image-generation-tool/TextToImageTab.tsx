"use client";

import ImageGenerationTab from "./ImageGenerationTab";

interface TextToImageTabProps {
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  promptValue?: string;
  onPromptChange?: (value: string) => void;
}

export default function TextToImageTab({
  descriptionLabel,
  descriptionPlaceholder,
  promptValue,
  onPromptChange,
}: TextToImageTabProps) {
  return (
    <ImageGenerationTab
      mode="text-to-image"
      descriptionLabel={descriptionLabel}
      descriptionPlaceholder={descriptionPlaceholder}
      promptValue={promptValue}
      onPromptChange={onPromptChange}
    />
  );
}
