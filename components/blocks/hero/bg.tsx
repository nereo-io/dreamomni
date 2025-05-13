"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// 定义类型接口
interface Meteor {
  top: number;
  left: number;
  duration: number;
  delay: number;
  key: number;
}

interface Star {
  size: number;
  top: number;
  left: number;
  opacity: number;
  animationDelay: number;
  shouldAnimate: boolean;
  key: number;
}

interface BrightStar {
  size: number;
  top: number;
  left: number;
  blur: number;
  animationDuration: number;
  key: number;
}

// 流星效果组件
const Meteors = ({ number = 20, className = "" }) => {
  const [meteors, setMeteors] = useState<Meteor[]>([]);

  useEffect(() => {
    const newMeteors = Array.from({ length: number }).map((_, idx) => {
      const top = Math.floor(Math.random() * 50); // 让流星从上半部分开始
      const left = Math.floor(Math.random() * 100);
      const duration = Math.random() * 6 + 6; // 6-12秒范围 (比之前慢20%)
      const delay = Math.random() * 18; // 更长的延迟使流星看起来更自然

      return { top, left, duration, delay, key: idx };
    });

    setMeteors(newMeteors);
  }, [number]);

  return (
    <>
      {meteors.map((meteor) => (
        <span
          key={meteor.key}
          className={cn(
            "absolute h-[1px] w-[1px] rounded-full bg-orange-400",
            className
          )}
          style={{
            top: `${meteor.top}%`,
            left: `${meteor.left}%`,
            animationDelay: `${meteor.delay}s`,
            transform: "rotate(25deg)", // 更倾斜的角度，从左上到右下
            boxShadow: "0 0 1px 1px rgba(249, 115, 22, 0.8)", // 增强发光效果
          }}
        >
          <div
            className="absolute h-[1px] w-[120px] animate-meteor"
            style={
              {
                background:
                  "linear-gradient(to right, rgba(249, 115, 22, 1) 0%, rgba(249, 115, 22, 0) 100%)",
                "--duration": `${meteor.duration}s`,
              } as React.CSSProperties
            }
          />
        </span>
      ))}
    </>
  );
};

// 亮星效果 - 更亮的大星星
const BrightStars = ({ count = 15 }) => {
  const [stars, setStars] = useState<BrightStar[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: count }).map((_, idx) => {
      const size = Math.random() * 1.5 + 2; // 更大的星星
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const blur = Math.random() * 3;
      const animationDuration = Math.random() * 3 + 2;

      return { size, top, left, blur, animationDuration, key: idx };
    });

    setStars(newStars);
  }, [count]);

  return (
    <>
      {stars.map((star) => (
        <div
          key={star.key}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            filter: `blur(${star.blur}px)`,
            boxShadow: "0 0 4px 1px rgba(255, 255, 255, 0.9)",
            animationDuration: `${star.animationDuration}s`,
            opacity: 0.9,
          }}
        />
      ))}
    </>
  );
};

// 星星效果组件
const Stars = ({ count = 100 }) => {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: count }).map((_, idx) => {
      const size = Math.random() * 2 + 0.5;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const opacity = Math.random() * 0.7 + 0.3;
      const animationDelay = Math.random() * 10;
      const shouldAnimate = Math.random() > 0.8;

      return {
        size,
        top,
        left,
        opacity,
        animationDelay,
        shouldAnimate,
        key: idx,
      };
    });

    setStars(newStars);
  }, [count]);

  return (
    <>
      {stars.map((star) => (
        <div
          key={star.key}
          className={cn(
            "absolute rounded-full bg-white",
            star.shouldAnimate && "animate-pulse"
          )}
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            opacity: star.opacity,
            animationDelay: `${star.animationDelay}s`,
          }}
        />
      ))}
    </>
  );
};

// 星云效果
const Nebula = () => {
  return (
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-[10%] left-[5%] w-[40%] h-[30%] rounded-full bg-blue-400/30 blur-3xl"></div>
      <div className="absolute top-[40%] right-[15%] w-[30%] h-[25%] rounded-full bg-purple-400/20 blur-3xl"></div>
      <div className="absolute bottom-[20%] left-[30%] w-[25%] h-[20%] rounded-full bg-pink-400/20 blur-3xl"></div>
    </div>
  );
};

// 深色背景组件
const DarkBackground = () => {
  return (
    <div className="absolute inset-0 -z-50 overflow-hidden bg-[#0a0a17]">
      {/* 星云效果 */}
      <Nebula />

      {/* 星星效果 */}
      <Stars count={150} />

      {/* 亮星效果 */}
      <BrightStars count={12} />

      {/* 流星效果 - 普通 */}
      <Meteors number={3} />

      {/* 流星效果 - 快速小流星 */}
      <Meteors number={1} className="scale-[0.4]" />

      {/* 流星效果 - 慢速大流星 */}
      <Meteors number={1} className="scale-[1.5]" />

      {/* 星座连线图案 */}
      <div className="absolute right-10 top-40 h-80 w-80 opacity-15">
        <svg
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          {/* 连线 */}
          <line
            x1="100"
            y1="100"
            x2="150"
            y2="150"
            stroke="hsl(30, 100%, 80%)"
            strokeWidth="1"
          />
          <line
            x1="150"
            y1="150"
            x2="250"
            y2="170"
            stroke="hsl(30, 100%, 80%)"
            strokeWidth="1"
          />
          <line
            x1="250"
            y1="170"
            x2="300"
            y2="120"
            stroke="hsl(30, 100%, 80%)"
            strokeWidth="1"
          />
          <line
            x1="300"
            y1="120"
            x2="250"
            y2="80"
            stroke="hsl(30, 100%, 80%)"
            strokeWidth="1"
          />
          <line
            x1="250"
            y1="80"
            x2="150"
            y2="150"
            stroke="hsl(30, 100%, 80%)"
            strokeWidth="1"
          />
          <line
            x1="150"
            y1="150"
            x2="150"
            y2="250"
            stroke="hsl(30, 100%, 80%)"
            strokeWidth="1"
          />
          <line
            x1="150"
            y1="250"
            x2="200"
            y2="300"
            stroke="hsl(30, 100%, 80%)"
            strokeWidth="1"
          />
          <line
            x1="200"
            y1="300"
            x2="250"
            y2="250"
            stroke="hsl(30, 100%, 80%)"
            strokeWidth="1"
          />
          <line
            x1="250"
            y1="250"
            x2="300"
            y2="280"
            stroke="hsl(30, 100%, 80%)"
            strokeWidth="1"
          />

          {/* 连接点 */}
          <circle cx="100" cy="100" r="3" fill="hsl(30, 100%, 80%)" />
          <circle cx="150" cy="150" r="4" fill="hsl(30, 100%, 80%)" />
          <circle cx="250" cy="170" r="3" fill="hsl(30, 100%, 80%)" />
          <circle cx="300" cy="120" r="3" fill="hsl(30, 100%, 80%)" />
          <circle cx="250" cy="80" r="3" fill="hsl(30, 100%, 80%)" />
          <circle cx="150" cy="250" r="3" fill="hsl(30, 100%, 80%)" />
          <circle cx="200" cy="300" r="3" fill="hsl(30, 100%, 80%)" />
          <circle cx="250" cy="250" r="3" fill="hsl(30, 100%, 80%)" />
          <circle cx="300" cy="280" r="3" fill="hsl(30, 100%, 80%)" />
        </svg>
      </div>

      {/* 渐变光晕 */}
      <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-indigo-950/30 to-transparent"></div>

      {/* 整体渐变效果 */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50"></div>
    </div>
  );
};

// 亮色背景组件 - 网格样式
const LightBackground = () => {
  return (
    <div className="absolute inset-0 -z-50 overflow-hidden bg-background">
      {/* 网格背景 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        fill="none"
        className="absolute w-full h-full opacity-30"
      >
        <g>
          <rect width="1920" height="1080" />
          {/* 水平线和垂直线 */}
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`h-${i}`}
              y1={`${99.5 + i * 90}`}
              x2="1920"
              y2={`${99.5 + i * 90}`}
              className="stroke-gray-400"
            />
          ))}
          {Array.from({ length: 21 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={`${99.5 + i * 90}`}
              y1="0"
              x2={`${99.5 + i * 90}`}
              y2="1080"
              className="stroke-gray-400"
            />
          ))}
        </g>
      </svg>

      {/* 装饰性圆点 */}
      <div className="absolute left-[10%] top-[20%] h-6 w-6 rounded-full bg-purple-200 opacity-70"></div>
      <div className="absolute left-[25%] top-[35%] h-4 w-4 rounded-full bg-blue-200 opacity-60"></div>
      <div className="absolute left-[18%] top-[60%] h-5 w-5 rounded-full bg-indigo-200 opacity-70"></div>
      <div className="absolute right-[20%] top-[25%] h-5 w-5 rounded-full bg-orange-200 opacity-60"></div>
      <div className="absolute right-[30%] top-[60%] h-4 w-4 rounded-full bg-rose-200 opacity-70"></div>

      {/* 底部渐变 */}
      <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-white to-transparent"></div>
    </div>
  );
};

export default function HeroBg() {
  return (
    <>
      {/* 亮色模式显示网格背景，深色模式隐藏 */}
      <div className="block dark:hidden">
        <LightBackground />
      </div>

      {/* 深色模式显示流星背景，亮色模式隐藏 */}
      <div className="hidden dark:block">
        <DarkBackground />
      </div>
    </>
  );
}
