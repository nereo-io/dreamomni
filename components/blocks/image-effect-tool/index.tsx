"use client";

import EffectFormPlaceholder from "./EffectFormPlaceholder";
import ImageHistoryForGeneration from "@/components/blocks/image-history-for-generation";
import VideoHistory from "@/components/blocks/video-history";
import { useAppContext } from "@/contexts/app";
import type { ImageEffectToolProps } from "@/types/blocks/image-effect-tool";

export default function ImageEffectTool({ config }: ImageEffectToolProps) {
  const { user } = useAppContext();

  return (
    <div className="flex flex-col lg:flex-row gap-2 h-full">
      <EffectFormPlaceholder />
      {config.type === "image" ? (
        <ImageHistoryForGeneration userId={user?.uuid} />
      ) : (
        <VideoHistory />
      )}
    </div>
  );
}
