"use client";

import React from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShowcaseVideo } from "@/data/showcase-text-videos";

interface ShowcaseCardProps {
  video: ShowcaseVideo;
  isSelected: boolean;
  onSelect: (video: ShowcaseVideo) => void;
  onCreate: (video: ShowcaseVideo) => void;
}

export default function ShowcaseCard({
  video,
  isSelected,
  onSelect,
  onCreate,
}: ShowcaseCardProps) {
  return (
    <div
      className="relative flex-shrink-0 w-[180px] cursor-pointer group"
      onClick={() => onSelect(video)}
      style={{ scrollSnapAlign: "start" }}
    >
      {/* Card with border */}
      <div
        className={cn(
          "relative bg-gray-800 rounded-lg overflow-hidden transition-all duration-300",
          isSelected
            ? "border-2 border-primary"
            : "border-2 border-transparent hover:border-primary/50"
        )}
        style={{ aspectRatio: "16/12" }}
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Create button - shown on hover, positioned in lower middle */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCreate(video);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2.5 py-1 rounded-md flex items-center gap-1 text-xs"
          >
            <Play className="h-3 w-3" />
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
