"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

// 定义基础特性接口
interface FeatureItem {
  title: string;
  description: string;
}

// 定义表格相关接口
// 定义单元格数据类型接口
export interface TableCell {
  type: "text" | "image";
  content: string;
  altText?: string; // 仅图片类型需要
}

// 定义表头列数据类型接口
export interface TableHeader {
  title: string;
}

// 定义表格行数据类型接口
export interface TableRow {
  cells: TableCell[];
}

// 定义完整表格数据接口
export interface TableData {
  headers: TableHeader[];
  rows: TableRow[];
}

// 定义详情项接口
interface DetailItem {
  title: string;
  description: string;
  type: "table" | "video";
  data: TableData | string;
  poster?: string; // 视频封面图URL，可选
}

// 定义完整的section接口
interface KeyFeaturesSection {
  title?: string;
  features?: FeatureItem[];
  details?: DetailItem[];
}

// 定义组件接口
interface ModelKeyFeaturesProps {
  section: Partial<KeyFeaturesSection>;
}

// 定义表格组件接口
interface DynamicTableProps {
  tableData: TableData;
}

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
  const columnWidth = headers.length > 0 ? `${100 / headers.length}%` : "auto";

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700/50 shadow-xl bg-gray-900/80 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-gray-600">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-800/90">
            {headers.map((header, index) => (
              <th
                key={index}
                className="p-5 text-center text-sm font-medium text-white border-b border-gray-700/50 transition-colors duration-300 hover:bg-gray-700/70"
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
              className={`transition-colors duration-300 hover:bg-gray-800/50 ${
                rowIndex % 2 === 0 ? "bg-gray-900/40" : "bg-gray-900/20"
              }`}
            >
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="p-5 border-b border-gray-700/50 transition-all duration-300"
                  style={{ width: columnWidth }}
                >
                  {cell.type === "image" ? (
                    <div className="bg-gray-800/60 p-3 rounded-lg overflow-hidden shadow-inner transition-all duration-300 hover:shadow-lg">
                      <Image
                        src={cell.content}
                        alt={
                          cell.altText ||
                          `Image ${rowIndex + 1}-${cellIndex + 1}`
                        }
                        width={200}
                        height={200}
                        className="rounded object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                        style={{ aspectRatio: "1/1" }}
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-800/60 p-4 rounded-lg h-full flex items-center shadow-inner transition-all duration-300 hover:shadow-lg hover:bg-gray-800/80">
                      <p className="text-gray-200 text-sm font-medium transition-colors duration-300 hover:text-white">
                        {cell.content}
                      </p>
                    </div>
                  )}
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
          className="block p-2 rounded-lg hover:bg-emerald-900/20 transition-all duration-300 cursor-pointer group"
        >
          <span className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors duration-300">
            {title}：
          </span>
          <span className="ml-2 text-gray-300 group-hover:text-gray-200">
            {description}
          </span>
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
        video.addEventListener('loadedmetadata', async () => {
          try {
            // 视频加载足够的数据来获取第一帧
            // 由于浏览器的自动播放政策，我们可能需要用户交互才能播放
            // 这里我们使用preload和seek的方式来获取第一帧
            video.currentTime = 0.1;
            
            // 监听seeked事件，确保视频已经定位到指定时间点
            const handleSeeked = () => {
              try {
                // 创建canvas来捕获第一帧
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  // 将canvas内容转换为base64编码的图片
                  const posterUrl = canvas.toDataURL('image/jpeg');
                  setPoster(posterUrl);
                }
              } catch (error) {
                console.error('Failed to capture first frame as poster:', error);
              }
              // 移除事件监听器
              video.removeEventListener('seeked', handleSeeked);
            };
            
            video.addEventListener('seeked', handleSeeked);
          } catch (error) {
            console.error('Failed to load video metadata:', error);
          }
        });
      } catch (error) {
        console.error('Failed to set up video for poster capture:', error);
      }
    };

    captureFirstFrame();

    return () => {
      // 清理工作
      if (video) {
        video.src = '';
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
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900/80 to-blue-950/90 text-white py-20">
      <div className="container mx-auto px-4">
        {/* Key Features Section */}
        <div className="mb-20">
          <h2
            ref={titleRef}
            className={`text-4xl md:text-5xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500 transition-all duration-1000 ease-out transform ${
              isTitleVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-[-30px] opacity-0"
            }`}
          >
            {safeSection.title}
          </h2>
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mx-auto shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-emerald-500/20">
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
                  className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400"
                  id={`detail-title-${index}`}
                >
                  {item.title}
                </h2>
                <p className="text-gray-300 text-lg mb-12 max-w-6xl leading-relaxed">
                  {item.description}
                </p>
                {item.type === "table" && (
                  <div className="transform transition-all duration-500 hover:scale-[1.01]">
                    <DynamicTable tableData={item.data as TableData} />
                  </div>
                )}
                {item.type === "video" && (
                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 shadow-xl max-w-3xl mx-auto transition-all duration-500 hover:shadow-2xl hover:border-blue-500/20">
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
