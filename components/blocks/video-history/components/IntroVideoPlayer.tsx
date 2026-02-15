"use client";

import React from "react";

interface IntroVideoPlayerProps {
  videoUrl: string;
}

export default function IntroVideoPlayer({ videoUrl }: IntroVideoPlayerProps) {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{ paddingBottom: "56.25%" }}
        >
          <video
            className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            controls
            autoPlay
            muted
            loop
            playsInline
            src={videoUrl}
          />
        </div>
      </div>
    </div>
  );
}
