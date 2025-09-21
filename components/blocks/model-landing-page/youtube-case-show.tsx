"use client";
import React, { useEffect, useRef, useState } from "react";
import { YoutubeCasesSection, type VideoCard } from "@/types/pages/nano-banana";

interface YouTubeCaseShowProps {
  section: YoutubeCasesSection;
}

const VideoCard: React.FC<VideoCard> = ({ width, height, youtubeLink }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="relative overflow-hidden rounded-lg shadow-lg group">
      <div className="relative aspect-video bg-gray-900">
        {/* 使用iframe嵌入YouTube视频 */}
        <iframe
          ref={iframeRef}
          width={width}
          height={height}
          src={youtubeLink}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default function YoutubeCaseShow({ section }: YouTubeCaseShowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算一次显示的视频数量（在移动设备上显示1个，在桌面设备上显示3个）
  const getVisibleCount = () => {
    return window.innerWidth < 768 ? 1 : 3;
  };

  // 向左移动
  const moveLeft = () => {
    const visibleCount = getVisibleCount();
    setCurrentIndex((prev) => Math.max(0, prev - visibleCount));
  };

  // 向右移动
  const moveRight = () => {
    const visibleCount = getVisibleCount();
    const maxIndex = Math.max(0, section.videos.length - visibleCount);
    setCurrentIndex((prev) => Math.min(maxIndex, prev + visibleCount));
  };

  // 滚动到当前索引位置
  useEffect(() => {
    if (containerRef.current) {
      const visibleCount = getVisibleCount();
      const cardWidth = containerRef.current.offsetWidth / visibleCount;
      containerRef.current.scrollTo({
        left: currentIndex * cardWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex, section.videos.length]);

  // 响应窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, section.videos.length - visibleCount);
      setCurrentIndex((prev) => Math.min(maxIndex, prev));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [section.videos.length]);

  return (
    <div className="w-full py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-8">{section.title}</h2>

        <div className="relative h-full flex items-center justify-center">
          {/* 左右导航按钮 */}
          <button
            onClick={moveLeft}
            disabled={currentIndex === 0}
            className={`absolute top-1/2 left-[-40px] transform -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center transition-all duration-300 hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white/50 ${
              currentIndex === 0
                ? "opacity-50 cursor-not-allowed"
                : "opacity-100"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* 视频卡片容器 */}
          <div
            ref={containerRef}
            className="flex overflow-hidden snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }} // Firefox
          >
            {section.videos.map((video: VideoCard, index: number) => (
              <div
                key={index}
                className="flex-shrink-0 w-full md:w-1/3 px-2 snap-start"
              >
                <VideoCard
                  width={video.width}
                  height={video.height}
                  youtubeLink={video.youtubeLink}
                />
              </div>
            ))}
          </div>

          <button
            onClick={moveRight}
            disabled={
              currentIndex >=
              Math.max(0, section.videos.length - getVisibleCount())
            }
            className={`absolute top-1/2 right-[-40px] transform -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center transition-all duration-300 hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white/50 ${
              currentIndex >=
              Math.max(0, section.videos.length - getVisibleCount())
                ? "opacity-50 cursor-not-allowed"
                : "opacity-100"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
