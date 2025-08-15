"use client";

import React from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShowcaseVideo } from "@/data/showcase-videos";

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
  onCreate 
}: ShowcaseCardProps) {
  return (
    <div 
      className="relative flex-shrink-0 w-[180px] cursor-pointer"
      onClick={() => onSelect(video)}
      style={{ scrollSnapAlign: "start" }}
    >
      {/* Card with border */}
      <div 
        className={cn(
          "relative aspect-video bg-gray-800 rounded-lg overflow-hidden transition-all duration-300",
          isSelected 
            ? "border-2 border-blue-500" 
            : "border-2 border-transparent hover:border-gray-600"
        )}
      >
        <img 
          src={video.thumbnailUrl} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Play icon */}
        {!isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="h-4 w-4 text-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Create button - shown when selected */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onCreate(video);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-md flex items-center gap-1 text-sm"
            >
              <Play className="h-3 w-3" />
              Create
            </Button>
          </div>
        )}

        {/* Video info */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h4 className="text-white font-medium text-xs truncate">{video.title}</h4>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-gray-300">{video.duration}s</span>
            <span className="text-[10px] text-gray-400">•</span>
            <span className="text-[10px] text-gray-300">{video.aspectRatio}</span>
          </div>
        </div>
      </div>
    </div>
  );
}