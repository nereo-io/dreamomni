"use client";
import React, { useEffect } from "react";
import { RedditCaseShowProps } from "@/types/pages/nano-banana";

export default function RedditCaseShow({ section }: RedditCaseShowProps) {
  useEffect(() => {
    // 添加事件监听器来处理来自iframe的消息
    const handleMessage = (event: MessageEvent) => {
      try {
        // 尝试解析消息数据
        const data = JSON.parse(event.data);

        // 检查是否是resize.embed类型的消息
        if (data && data.type === "resize.embed" && data.data) {
          // 获取所有的reddit iframe元素，并进行类型断言
          const iframes = document.querySelectorAll<HTMLIFrameElement>(
            'iframe[src*="reddit.com"]'
          );

          // 遍历所有iframe，找到发送消息的iframe并调整其高度
          iframes.forEach((iframe) => {
            if (iframe.contentWindow === event.source) {
              iframe.setAttribute("height", `${data.data}`);
              iframe.setAttribute("scrolling", "no");
            }
          });
        }
      } catch (error) {
        console.error("解析iframe消息时出错:", error);
      }
    };

    // 添加事件监听器
    window.addEventListener("message", handleMessage);

    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className="w-full py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-8">{section.title}</h2>
        {/* 使用CSS columns实现瀑布流布局 */}
        <div className="columns-1 sm:columns-2 lg:columns-4 gap-6 column-fill-auto">
          {section.content.map((item) => (
            <iframe
              key={item.id || `item-${Math.random().toString(36).substr(2, 9)}`}
              src={item.src}
              width={item.width}
              height={item.height}
              className="w-full object-cover border-0 rounded-lg shadow-lg mb-6"
              title={
                item.id ||
                `Reddit item ${Math.random().toString(36).substr(2, 9)}`
              }
              sandbox="allow-scripts allow-same-origin allow-popups"
              allow="clipboard-read; clipboard-write"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
