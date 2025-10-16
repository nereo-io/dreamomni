"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import {
  FeatureItem,
  TableRow,
  TableData,
  ModelKeyFeaturesProps,
  DynamicTableProps,
  TableCell,
} from "@/types/pages/model-landing-page";

const DynamicTable: React.FC<DynamicTableProps> = ({ tableData }) => {
  const { headers, rows } = tableData;

  // 确保所有行都有相同数量的单元格，如果不匹配则用空单元格补齐
  const ensureConsistentRowLength = (
    row: TableRow,
    expectedLength: number
  ): TableRow => {
    if (row.cells.length >= expectedLength) {
      return { cells: row.cells.slice(0, expectedLength) };
    }

    const paddedCells = [...row.cells];
    while (paddedCells.length < expectedLength) {
      paddedCells.push({ type: "text", content: "" });
    }

    return { cells: paddedCells };
  };

  // 规范化所有行
  const normalizedRows = rows.map((row) =>
    ensureConsistentRowLength(row, headers.length)
  );

  // 响应式列宽：自动平分剩余空间
  const columnWidth = headers.length > 0 ? `${100 / headers.length}%` : "auto";

  // 渲染单元格内容 - 简化版，去掉冗余背景层
  const renderCellContent = (
    cell: TableCell,
    rowIndex: number,
    cellIndex: number
  ) => {
    switch (cell.type) {
      case "image":
        return (
          <Image
            src={cell.content}
            alt={cell.altText || ""}
            width={1024}
            height={1024}
            className="rounded object-cover w-full h-full"
            style={{ aspectRatio: "1/1" }}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        );

      case "video":
        return (
          <video
            src={cell.content}
            controls
            className="rounded w-full h-auto"
            poster={cell.poster}
            aria-label={`Video content ${rowIndex + 1}-${cellIndex + 1}`}
          />
        );

      case "text":
        return <p className="text-foreground/90 text-sm">{cell.content}</p>;

      default:
        console.warn(`Unsupported cell type: ${(cell as any).type}`);
        return (
          <span className="text-sm text-muted-foreground">
            Unsupported content
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-secondary/50 border-b border-border/50">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-center text-sm font-medium text-foreground"
                style={{ width: columnWidth }}
              >
                {header.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {normalizedRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
            >
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="p-4"
                  style={{ width: columnWidth }}
                  role="gridcell"
                  aria-colindex={cellIndex + 1}
                >
                  {renderCellContent(cell, rowIndex, cellIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// FeatureItem组件 - 网格布局 + 图标
const FeatureItemComponent: React.FC<FeatureItem & { index: number }> =
  React.memo(({ title, description, index }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // 滚动到详情区
    const scrollToDetail = () => {
      const targetId = `detail-${index}`;
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        setTimeout(() => {
          const yOffset = -80;
          const y =
            targetElement.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }, 100);
      }
    };

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, []);

    return (
      <div
        ref={ref}
        className={`h-full transition-all duration-700 ease-out transform ${
          isVisible
            ? "translate-x-0 opacity-100"
            : "translate-x-[-20px] opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={scrollToDetail}
          className="flex h-full w-full items-start gap-4 rounded-xl border border-white/10 bg-white/[0.08] px-5 py-4 text-left transition hover:border-primary/70 hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/40">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-white">{title}</span>
            <span className="mt-1 text-sm leading-relaxed text-white/90">
              {description}
            </span>
          </div>
        </button>
      </div>
    );
  });

// 添加显示名称便于调试
FeatureItemComponent.displayName = "FeatureItemComponent";

// 视频自动捕获第一帧作为封面的组件
const VideoWithAutoPoster: React.FC<{
  src: string;
  className?: string;
}> = ({ src, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [poster, setPoster] = useState<string | undefined>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 尝试捕获第一帧作为封面
    const captureFirstFrame = async () => {
      try {
        // 设置视频源
        video.src = src;

        // 监听元数据加载事件
        video.addEventListener("loadedmetadata", async () => {
          try {
            // 视频加载足够的数据来获取第一帧
            // 由于浏览器的自动播放政策，我们可能需要用户交互才能播放
            // 这里我们使用preload和seek的方式来获取第一帧
            video.currentTime = 0.1;

            // 监听seeked事件，确保视频已经定位到指定时间点
            const handleSeeked = () => {
              try {
                // 创建canvas来捕获第一帧
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  // 将canvas内容转换为base64编码的图片
                  const posterUrl = canvas.toDataURL("image/jpeg");
                  setPoster(posterUrl);
                }
              } catch (error) {
                console.error(
                  "Failed to capture first frame as poster:",
                  error
                );
              }
              // 移除事件监听器
              video.removeEventListener("seeked", handleSeeked);
            };

            video.addEventListener("seeked", handleSeeked);
          } catch (error) {
            console.error("Failed to load video metadata:", error);
          }
        });
      } catch (error) {
        console.error("Failed to set up video for poster capture:", error);
      }
    };

    captureFirstFrame();

    return () => {
      // 清理工作
      if (video) {
        video.src = "";
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      className={className}
      preload="metadata"
      poster={poster}
    />
  );
};

export default function ModelKeyFeatures({ section }: ModelKeyFeaturesProps) {
  // 为所有必需属性提供默认值，防止数据不完整时出错
  const safeSection = {
    title: section.title || "Key Features",
    details: section.details || [],
  };

  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTitleVisible, setIsTitleVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsTitleVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (titleRef.current) {
      observer.observe(titleRef.current);
    }

    return () => {
      if (titleRef.current) {
        observer.unobserve(titleRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen py-20 bg-gray-900">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Key Features Section */}
        <div className="mb-20">
          <h2
            ref={titleRef}
            className={`text-4xl md:text-5xl font-bold mb-10 text-center text-foreground transition-all duration-1000 ease-out transform ${
              isTitleVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-[-30px] opacity-0"
            }`}
          >
            {safeSection.title}
          </h2>
          {/* <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 md:grid-cols-2 md:auto-rows-fr">
              {safeSection.features.map((feature, index) => (
                <FeatureItemComponent
                  key={index}
                  index={index}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div> */}
        </div>

        {safeSection.details.map((item, index) => (
          <section id={`detail-${index}`} key={index} className="py-20">
            <h3
              className="text-3xl md:text-4xl font-bold mb-6 text-foreground"
              id={`detail-title-${index}`}
            >
              {item.title}
            </h3>
            <p className="text-foreground/90 text-lg mb-12 leading-relaxed">
              {item.description}
            </p>
            {item.type === "table" && (
              <DynamicTable tableData={item.data as TableData} />
            )}
            {item.type === "video" && (
              <div className="bg-card/30 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 max-w-4xl mx-auto flex justify-center">
                {item.poster ? (
                  <video
                    src={item.data as string}
                    controls
                    className="w-full h-auto max-h-[600px] object-contain"
                    preload="metadata"
                    poster={item.poster}
                  />
                ) : (
                  <VideoWithAutoPoster
                    src={item.data as string}
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
