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
        className="absolute inset-0 w-full h-full object-cover"
        style={{ minWidth: "100%", minHeight: "100%" }}
      >
        <source
          src={`https://r2.veo3ai.io/intro/video-intro.mp4`}
          type="video/mp4"
        />
        您的浏览器不支持视频播放。
      </video>

      {/* 深色遮罩层，确保文字可读性 */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70"></div>

      {/* 渐变遮罩，增强视觉效果 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60"></div>
    </div>
  );
};

export default function HeroBg() {
  return <VideoBackground />;
}
