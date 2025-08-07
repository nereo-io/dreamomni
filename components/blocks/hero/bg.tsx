"use client";

import React from "react";

// 视频背景组件
const VideoBackground = () => {
  return (
    <div className="absolute inset-0 -z-50 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/imgs/intro/veo-cover-202508-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ minWidth: "100%", minHeight: "100%" }}
      >
        <source
          src={`https://r2.veo3ai.io/intro/Veo-Cover-202508.mp4`}
          type="video/mp4"
        />
        Your browser does not support video playback.
      </video>
    </div>
  );
};

export default function HeroBg() {
  return <VideoBackground />;
}
