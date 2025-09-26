"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
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

  // 计算每列的宽度百分比，确保列宽一致
  const columnWidth =
    headers.length > 0 ? `${1000 / headers.length}px` : "auto";

  // 创建一个辅助函数来渲染单元格内容，提高代码可维护性
  const renderCellContent = (
    cell: TableCell, // 修改类型为TableCell
    rowIndex: number,
    cellIndex: number
  ) => {
    // 通用的容器类名
    const containerBaseClasses =
      "bg-secondary/60 p-3 rounded-lg overflow-hidden shadow-inner";

    switch (cell.type) {
      case "image":
        return (
          <div className={containerBaseClasses}>
            <Image
              src={cell.content}
              alt={cell.altText || ""} // 添加默认值避免undefined
              width={200}
              height={200}
              className="rounded object-cover w-full h-full"
              style={{ aspectRatio: "1/1" }}
              loading="lazy" // 添加懒加载提高性能
            />
          </div>
        );

      case "video":
        return (
          <div className={containerBaseClasses}>
            <video
              src={cell.content}
              controls
              className="rounded w-full h-auto"
              poster={cell.poster}
              aria-label={`Video content ${rowIndex + 1}-${cellIndex + 1}`} // 提高可访问性
            />
          </div>
        );

      case "text":
        return (
          <div
            className={`${containerBaseClasses} p-4 h-full flex items-center`}
          >
            <p className="text-foreground text-sm font-medium">
              {cell.content}
            </p>
          </div>
        );

      default:
        // 添加类型保护，防止意外的单元格类型
        console.warn(`Unsupported cell type: ${(cell as any).type}`);
        return (
          <div
            className={`${containerBaseClasses} p-4 h-full flex items-center justify-center text-muted-foreground`}
          >
            <span className="text-sm">Unsupported content</span>
          </div>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border shadow-xl bg-card backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-secondary/80">
            {headers.map((header, index) => (
              <th
                key={index}
                className="p-5 text-center text-sm font-medium text-card-foreground border-b border-border transition-colors duration-300 hover:bg-secondary"
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
              className={`transition-colors duration-300 hover:bg-secondary/30 ${
                rowIndex % 2 === 0 ? "bg-background/40" : "bg-background/20"
              }`}
            >
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="p-5 border-b border-border transition-all duration-300"
                  style={{ width: columnWidth }}
                  role="gridcell" // 提高可访问性
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

// FeatureItem组件 - 使用React.memo优化性能
const FeatureItemComponent: React.FC<FeatureItem & { index: number }> =
  React.memo(({ title, description, index }) => {
    const ref = useRef<HTMLLIElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // 创建锚点点击处理函数
    const scrollToDetail = (e: React.MouseEvent) => {
      e.preventDefault();
      const targetId = `detail-${index}`;
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        // 添加一个微小的偏移量，确保标题完全可见
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
      <li
        ref={ref}
        className={`transition-all duration-700 ease-out transform ${
          isVisible
            ? "translate-x-0 opacity-100"
            : "translate-x-[-20px] opacity-0"
        }`}
      >
        <a
          href={`#detail-${index}`}
          onClick={scrollToDetail}
          className="block p-2 rounded-lg hover:bg-primary/10 transition-all duration-300 cursor-pointer group"
        >
          <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary/80 to-primary transition-all duration-300">
            {title}：
          </span>
          <span className="ml-2 text-foreground">{description}</span>
        </a>
      </li>
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
    features: section.features || [],
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
    <div className="min-h-screen text-foreground py-20 bg-gray-900">
      <div className="container mx-auto px-4">
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
          <div className="bg-card backdrop-blur-sm rounded-2xl p-8 border border-border mx-auto shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-primary/20">
            <ul>
              {safeSection.features.map((feature, index) => (
                <FeatureItemComponent
                  key={index}
                  index={index}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </ul>
          </div>
        </div>

        {safeSection.details.map((item, index) => (
          <section
            id={`detail-${index}`}
            key={index}
            className={`py-20 transition-all duration-700 ease-out transform opacity-100`}
          >
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                <h2
                  className="text-3xl md:text-4xl font-bold mb-6 text-foreground"
                  id={`detail-title-${index}`}
                >
                  {item.title}
                </h2>
                <p className="text-foreground text-lg mb-12 max-w-6xl leading-relaxed">
                  {item.description}
                </p>
                {item.type === "table" && (
                  <div className="transform transition-all duration-500 hover:scale-[1.01]">
                    <DynamicTable tableData={item.data as TableData} />
                  </div>
                )}
                {item.type === "video" && (
                  <div className="bg-secondary/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-border shadow-xl max-w-3xl mx-auto transition-all duration-500 hover:shadow-2xl hover:border-primary/20">
                    {item.poster ? (
                      // 如果提供了封面图，则使用原始video标签
                      <video
                        src={item.data as string}
                        controls
                        className="w-full h-auto rounded-t-lg"
                        preload="metadata"
                        poster={item.poster}
                      />
                    ) : (
                      // 如果没有提供封面图，则使用自动捕获第一帧的组件
                      <VideoWithAutoPoster
                        src={item.data as string}
                        className="w-full h-auto rounded-t-lg"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
