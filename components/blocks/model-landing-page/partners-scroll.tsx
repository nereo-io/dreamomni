"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Partner {
  name: string;
  logo: string;
}

interface PartnersSection {
  items: Partner[];
}

interface PartnersScrollProps {
  className?: string;
  speed?: number; // 滚动速度，单位为像素/秒
  section: PartnersSection;
}

export default function PartnersScroll({
  className,
  speed = 60, // 提高默认滚动速度
  section,
}: PartnersScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current || !contentRef.current || section.items.length === 0)
      return;

    const content = contentRef.current;
    const scrollContainer = scrollRef.current;

    // 创建多个克隆以确保无缝滚动效果
    const clone1 = content.cloneNode(true);
    const clone2 = content.cloneNode(true);
    scrollContainer.appendChild(clone1);
    scrollContainer.appendChild(clone2);

    let animationId: number;
    let startTime: number;
    let distance = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // 计算滚动距离
      distance = (elapsed * speed) / 1000;

      // 使用取模运算代替直接重置，实现更平滑的循环
      const contentWidth = content.offsetWidth;
      const translateX = -(distance % contentWidth);

      scrollContainer.style.transform = `translateX(${translateX}px)`;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [speed, section.items]);

  return (
    <div
      className={cn(
        "w-full overflow-hidden bg-gray-900 py-6 md:py-8 relative",
        className
      )}
    >
      <div
        ref={scrollRef}
        className="inline-flex transition-transform duration-0 ease-linear"
        style={{ willChange: "transform" }}
      >
        <div
          ref={contentRef}
          className="flex items-center space-x-8 md:space-x-16"
        >
          {section.items.map((partner, index) => (
            <div
              key={index}
              className="flex items-center justify-center h-16"
              aria-label={partner.name}
            >
              <div
                className="h-8 w-32 md:h-10 md:w-40 bg-contain bg-center bg-no-repeat opacity-80"
                style={{
                  backgroundImage: `url(${partner.logo})`,
                  filter:
                    "brightness(0) invert(1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))",
                }}
                role="img"
                aria-label={partner.name}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
