"use client";
import React, { useEffect, useRef, useState } from "react";
import type {
  VideoCard as VideoCardType,
  YouTubeCaseShowProps,
} from "@/types/pages/model-landing-page";

// 导航按钮组件
const NavigationButton: React.FC<{
  direction: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}> = ({ direction, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "上一页" : "下一页"}
      className={`
        absolute top-1/2 ${direction === "left" ? "left-6" : "right-6"}
        transform -translate-y-1/2 z-10 
        w-10 h-10 rounded-full 
        bg-white
        text-black flex items-center justify-center 
        transition-all duration-300 
        focus:outline-none focus:ring-2 focus:ring-gray-400
        ${disabled ? "opacity-40 cursor-not-allowed" : "opacity-100"}
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
};

export default function YoutubeCaseShow({ section }: YouTubeCaseShowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算一次显示的视频数量（响应式）
  const getVisibleCount = () => {
    if (typeof window === "undefined") return 3; // SSR默认值
    if (window.innerWidth < 640) return 1; // 小屏幕
    if (window.innerWidth < 1024) return 2; // 中等屏幕
    return 3; // 大屏幕
  };

  // 向左移动
  const moveLeft = () => {
    const visibleCount = getVisibleCount();
    setCurrentIndex((prev) => Math.max(0, prev - visibleCount));
  };

  // 向右移动
  const moveRight = () => {
    const visibleCount = getVisibleCount();
    const maxIndex = Math.max(0, section.content.length - visibleCount);
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
  }, [currentIndex]);

  // 响应窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, section.content.length - visibleCount);
      setCurrentIndex((prev) => Math.min(maxIndex, prev));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [section.content.length]);

  return (
    <section className="w-full py-16 md:py-24 bg-gray-900">
      <div className="mx-auto px-2 md:px-4">
        {/* 标题区域 */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
            {section.title}
          </h2>
        </div>

        {/* 轮播区域 */}
        <div className="relative h-full">
          {/* 导航按钮 */}
          <NavigationButton
            direction="left"
            onClick={moveLeft}
            disabled={currentIndex === 0}
          />

          {/* 视频卡片容器 */}
          <div
            ref={containerRef}
            className="flex overflow-hidden snap-x snap-mandatory gap-3 md:gap-4"
            style={{
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE/Edge
            }}
          >
            {section.content.map((video: VideoCardType, index: number) => (
              <div
                key={index}
                className="flex-shrink-0 w-full sm:w-[calc(45%-12px)] lg:w-[calc(30%-16px)] snap-start"
              >
                <iframe
                  width="100%"
                  height="100%"
                  src={video.youtubeLink}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-full rounded-xl"
                  style={{ aspectRatio: "16/9" }}
                ></iframe>
              </div>
            ))}
          </div>

          <NavigationButton
            direction="right"
            onClick={moveRight}
            disabled={
              currentIndex >=
              Math.max(0, section.content.length - getVisibleCount())
            }
          />
        </div>
      </div>
    </section>
  );
}
