"use client";

import React from "react";

interface IntroVideoPlayerProps {
  videoUrl: string;
}

export default function IntroVideoPlayer({ videoUrl }: IntroVideoPlayerProps) {
  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <video
        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
        controls
        autoPlay
        muted
        loop
        playsInline
        src={videoUrl}
      />
    </div>
  );
}
