"use client";
import React, { useEffect, useRef, useMemo } from "react";
import { TwitterCaseShowProps } from "@/types/pages/model-landing-page";

export default function TwitterCaseShow({ section }: TwitterCaseShowProps) {
  // 使用useMemo为每个帖子生成稳定的ID，避免每次渲染时ID变化
  const itemIds = useMemo(() => {
    return section.content.map((item, index) => {
      return item.id || `twitter-item-${index}`;
    });
  }, [section.content]);

  // 存储iframe引用，确保iframe加载时脚本能够正确执行
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载Twitter embed脚本，让Twitter官方脚本处理iframe渲染
  useEffect(() => {
    // 检查Twitter脚本是否已加载
    if ((window as any).twttr && (window as any).twttr.widgets) {
      // 如果已加载，直接处理
      (window as any).twttr.widgets.load();
    } else {
      // 如果未加载，动态加载Twitter脚本
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      document.body.appendChild(script);
    }
  }, [section.content]);

  return (
    <div className="w-full py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-8">{section.title}</h2>
        {/* 使用CSS columns实现瀑布流布局 */}
        <div
          ref={containerRef}
          className="columns-1 sm:columns-2 lg:columns-4 gap-6 column-fill-auto"
        >
          {section.content.map((item, index) => {
            const id = itemIds[index];

            return (
              <div key={id} className="break-inside-avoid">
                <iframe
                  src={item.src}
                  className="w-full border-0 rounded-lg shadow-lg mb-6"
                  title={`Twitter item ${id}`}
                  scrolling="no"
                  style={{
                    width: item.width ? `${item.width}px` : "100%",
                    height: item.height ? `${item.height}px` : "auto",
                    maxWidth: "100%",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
