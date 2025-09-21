"use client";
import React, { useEffect, useRef, useState } from "react";
import type {
  VideoCard as VideoCardType,
  YouTubeCaseShowProps,
} from "@/types/pages/nano-banana";

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
        absolute top-1/2 ${direction === "left" ? "left-2 md:left-[-20px]" : "right-2 md:right-[-20px]"}
        transform -translate-y-1/2 z-10 
        w-10 h-10 rounded-full 
        bg-gradient-to-r ${direction === "left" 
          ? "from-purple-600 to-indigo-700" 
          : "from-indigo-700 to-purple-600"
        }
        text-white flex items-center justify-center 
        transition-all duration-300 
        hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30
        focus:outline-none focus:ring-2 focus:ring-purple-400
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

// 视频卡片组件
const VideoCard: React.FC<VideoCardType> = ({ width, height, youtubeLink }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="group relative overflow-hidden rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02]">
      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800">
        {/* 视频缩略图边框效果 */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* YouTube视频嵌入 */}
        <iframe
          ref={iframeRef}
          width={width}
          height={height}
          src={youtubeLink}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="w-full h-full rounded-xl"
          title="YouTube video player"
        />
      </div>
    </div>
  );
};

// 分页指示器组件
const PaginationIndicator: React.FC<{
  totalPages: number;
  currentPage: number;
}> = ({ totalPages, currentPage }) => {
  return (
    <div className="flex justify-center mt-6 gap-2">
      {Array.from({ length: totalPages }).map((_, index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all duration-300 ${
            index === currentPage
              ? "w-6 bg-purple-500"
              : "w-2 bg-gray-600 hover:bg-gray-500"
          }`}
        />
      ))}
    </div>
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

  // 计算总页数
  const totalPages = Math.ceil(section.content.length / getVisibleCount());
  const currentPage = Math.floor(currentIndex / getVisibleCount());

  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 md:px-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-gray-300 max-w-2xl mx-auto">
              {section.description}
            </p>
          )}
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
            className="flex overflow-hidden snap-x snap-mandatory gap-4 md:gap-6 pb-2"
            style={{ 
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none" // IE/Edge
            }}
          >
            {section.content.map((video: VideoCardType, index: number) => (
              <div
                key={index}
                className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 px-1 md:px-2 snap-start"
              >
                <VideoCard
                  width={video.width}
                  height={video.height}
                  youtubeLink={video.youtubeLink}
                />
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

        {/* 分页指示器 */}
        {totalPages > 1 && (
          <PaginationIndicator
            totalPages={totalPages}
            currentPage={currentPage}
          />
        )}
      </div>
    </section>
  );
}
