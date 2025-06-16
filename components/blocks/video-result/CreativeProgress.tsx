"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CreativeProgressProps {
  progress: number;
  status: string;
  remainingTime: string;
  t: any;
}

interface StageConfig {
  icon: string;
  message: string;
  subMessage: string;
  color: string;
  animation?: string;
}

export default function CreativeProgress({ 
  progress, 
  status, 
  remainingTime, 
  t 
}: CreativeProgressProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [animationFrame, setAnimationFrame] = useState(0);

  // 太空探索阶段配置 - 纯表情符号版本
  const spaceStages: StageConfig[] = [
    {
      icon: "🛸",
      message: "🔧⚡",
      subMessage: "🤖📡🎯",
      color: "text-blue-400",
      animation: "preparation"
    },
    {
      icon: "🚀", 
      message: "🔥💨",
      subMessage: "⚡🌟🎆",
      color: "text-orange-400",
      animation: "ignition"
    },
    {
      icon: "🌌",
      message: "✨🌟", 
      subMessage: "💫🪐🌠",
      color: "text-purple-400",
      animation: "galaxy"
    },
    {
      icon: "🛰️",
      message: "📡💻",
      subMessage: "📦🌍📲",
      color: "text-green-400", 
      animation: "transmission"
    },
    {
      icon: "🎯",
      message: "🎉✅",
      subMessage: "🏆💎🌟",
      color: "text-yellow-400",
      animation: "success"
    }
  ];

  // 根据进度确定当前阶段
  useEffect(() => {
    const stage = Math.min(
      Math.floor((progress / 100) * spaceStages.length),
      spaceStages.length - 1
    );
    setCurrentStage(Math.max(0, stage));
  }, [progress]);

  // 动画帧循环
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 60);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const current = spaceStages[currentStage];

  // 太空主题动画组件
  const SpaceAnimation = () => {
    switch (current?.animation) {
      case "preparation":
        return (
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full bg-blue-500",
              animationFrame % 20 < 10 ? "opacity-100" : "opacity-30"
            )} />
            <span className="text-xs text-blue-400">🔧</span>
          </div>
        );
      
      case "ignition":
        return (
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 h-4 bg-gradient-to-t from-orange-500 to-red-500 rounded-sm",
                  animationFrame % 8 === i ? "opacity-100 scale-125" : "opacity-40"  
                )}
              />
            ))}
          </div>
        );

      case "galaxy":
        return (
          <div className="relative w-16 h-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-1 h-1 bg-purple-400 rounded-full",
                  animationFrame % 20 === i * 3 ? "opacity-100 scale-150" : "opacity-60 scale-100"
                )}
                style={{
                  left: `${8 + i * 8 + Math.sin(animationFrame * 0.15 + i) * 4}px`,
                  top: `${12 + Math.cos(animationFrame * 0.1 + i) * 6}px`,
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center text-xs">
              🌌
            </div>
          </div>
        );

      case "transmission":
        return (
          <div className="flex items-center gap-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full bg-green-400 transition-all duration-300",
                  (animationFrame + i * 5) % 20 < 5 ? "opacity-100 scale-125" : "opacity-30 scale-75"
                )}
              />
            ))}
          </div>
        );

      case "success":
        return (
          <div className="relative">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-2 h-2 text-yellow-400",
                  animationFrame % 15 === i * 5 ? "opacity-100 scale-125" : "opacity-60 scale-100"
                )}
                style={{
                  left: `${20 + i * 15}px`,
                  top: `${5 + Math.sin(animationFrame * 0.2 + i) * 3}px`,
                  transform: `rotate(${animationFrame * 6 + i * 45}deg)`
                }}
              >
                ⭐
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // 太空雷达扫描动画
  const SpaceRadar = () => (
    <div className="flex items-center gap-1 opacity-60">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-3 border border-purple-400 rounded-sm transition-all duration-300",
            (animationFrame + i) % 8 < 2 ? "bg-purple-400/50 shadow-purple-400/50 shadow-sm" : "bg-gray-700"
          )}
        />
      ))}
    </div>
  );

  // 太空飞船进度指示器
  const SpaceshipProgress = () => (
    <div className="absolute inset-0">
      {/* 太空飞船 */}
      <div 
        className="absolute top-1/2 w-3 h-3 transform -translate-y-1/2 transition-all duration-500"
        style={{
          left: `${Math.min(progress, 95)}%`,
        }}
      >
        <div className="text-xs">🚀</div>
      </div>
      {/* 尾焰效果 */}
      <div 
        className="absolute top-1/2 w-2 h-1 bg-gradient-to-l from-orange-400 to-transparent rounded-full transform -translate-y-1/2 opacity-80"
        style={{ 
          left: `${Math.max(0, Math.min(progress, 95) - 5)}%`,
        }}
      />
      {/* 星星轨迹 */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute top-1/2 w-1 h-1 bg-blue-300 rounded-full transform -translate-y-1/2",
            animationFrame % 15 === i * 5 ? "opacity-100" : "opacity-30"
          )}
          style={{
            left: `${Math.max(0, Math.min(progress, 95) - 10 - i * 8)}%`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 主要场景展示 */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "text-2xl animate-bounce",
              current?.animation === "bounce" && "animate-bounce",
              current?.animation === "pulse" && "animate-pulse"
            )}>
              {current?.icon}
            </div>
            <div>
              <h3 className={cn("font-semibold", current?.color)}>
                {current?.message}
              </h3>
              <p className="text-sm text-gray-400">
                {current?.subMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SpaceAnimation />
            <div className="text-right">
              <div className="text-sm font-mono text-gray-300">
                {Math.round(progress)}%
              </div>
              <div className="text-xs text-gray-500">
                ⏰ {remainingTime}
              </div>
            </div>
          </div>
        </div>

        {/* 增强的进度条 */}
        <div className="relative">
          <Progress 
            value={progress} 
            className="h-3 bg-gray-700 border border-gray-600" 
          />
          <SpaceshipProgress />
        </div>

        {/* 底部装饰 */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <SpaceRadar />
          <div className="flex items-center gap-2">
            <span>🚀🤖✨</span>
            <span>•</span>
            <span>🌌📡🎬</span>
          </div>
        </div>
      </div>

      {/* 阶段指示器 */}
      <div className="flex justify-between items-center">
        {spaceStages.map((stage, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center gap-1 text-xs transition-all duration-300",
              index <= currentStage ? "text-white opacity-100" : "text-gray-500 opacity-50"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-all duration-300",
              index < currentStage 
                ? "border-green-400 bg-green-400/20 text-green-400" 
                : index === currentStage
                  ? "border-blue-400 bg-blue-400/20 text-blue-400 animate-pulse"
                  : "border-gray-600 bg-gray-800"
            )}>
              {index < currentStage ? "✓" : stage.icon}
            </div>
            <span className="max-w-16 text-center leading-3">
              {stage.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}