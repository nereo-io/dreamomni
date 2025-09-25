"use client";
import React, { useEffect, useRef, useState } from "react";
import { TwitterCaseShowProps } from "@/types/pages/model-landing-page";

export default function TwitterCaseShow({ section }: TwitterCaseShowProps) {
  // 存储每个iframe的引用和动态尺寸
  const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});
  const [dimensions, setDimensions] = useState<{
    [key: string]: { width: string; height: string };
  }>({});

  // 处理从iframe接收的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const origin = event.origin;
        if (
          origin !== "https://platform.twitter.com" &&
          origin !== "https://syndication.twitter.com"
        ) {
          return;
        }

        // 解析消息数据
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        // 处理尺寸更新消息 - 支持实际的Twitter JSON-RPC格式
        if (data) {
          // 格式1: 处理实际的Twitter JSON-RPC消息格式
          if (
            data["twttr.embed"] &&
            data["twttr.embed"].method === "twttr.private.resize" &&
            data["twttr.embed"].params &&
            data["twttr.embed"].params.length > 0
          ) {
            const resizeParams = data["twttr.embed"].params[0];
            const width = resizeParams.width;
            const height = resizeParams.height;

            if (width && height) {
              // 查找发送消息的iframe
              Object.entries(iframeRefs.current).forEach(([id, iframe]) => {
                if (iframe && iframe.contentWindow === event.source) {
                  setDimensions((prev) => ({
                    ...prev,
                    [id]: {
                      width: "100%", // 宽度保持100%以适应容器
                      height: `${height}px`,
                    },
                  }));
                }
              });
            }
          }
        }
      } catch (error) {
        console.error("Error processing Twitter iframe message:", error);
      }
    };

    // 添加消息事件监听器
    window.addEventListener("message", handleMessage);

    // 清理函数
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // 处理iframe加载完成事件
  const handleIframeLoad = (id: string, iframe: HTMLIFrameElement) => {
    // 存储iframe引用
    iframeRefs.current[id] = iframe;

    // 向iframe发送消息，请求尺寸信息
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          message: "getDimensions",
          id: id,
        }),
        "*" // 在实际应用中，最好指定Twitter的域名
      );
    }
  };

  // 为每个Twitter帖子生成唯一ID
  const getItemId = (item: (typeof section.content)[0]) => {
    return item.id || `twitter-item-${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className="w-full py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-8">{section.title}</h2>
        {/* 使用CSS columns实现瀑布流布局 */}
        <div className="columns-1 sm:columns-2 lg:columns-4 gap-6 column-fill-auto">
          {section.content.map((item) => {
            const id = getItemId(item);
            const dynamicDimensions = dimensions[id];

            return (
              <iframe
                key={id}
                ref={(el) => {
                  if (el) handleIframeLoad(id, el);
                }}
                src={item.src}
                className="w-full object-cover border-0 rounded-lg shadow-lg mb-6"
                title={`Twitter item ${id}`}
                // 添加scrolling="no"以防止iframe出现滚动条
                scrolling="no"
                // 添加style以确保尺寸正确应用
                style={
                  dynamicDimensions
                    ? {
                        width: dynamicDimensions.width,
                        height: dynamicDimensions.height,
                        maxWidth: "100%",
                      }
                    : {
                        maxWidth: "100%",
                      }
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
