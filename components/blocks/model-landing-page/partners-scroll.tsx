"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// 合作伙伴 logo 数据
const partners = [
  { name: "Coca-Cola", logo: "/imgs/partners/coca-cola-logo.png" },
  { name: "Microsoft", logo: "/imgs/partners/microsoft-logo.png" },
  { name: "Nike", logo: "/imgs/partners/nike-logo.png" },
  { name: "P&G", logo: "/imgs/partners/p-g-logo.png" },
  { name: "Lancome", logo: "/imgs/partners/lancome-logo.png" },
  { name: "Zoom", logo: "/imgs/partners/zoom-logo.png" },
  { name: "Sony", logo: "/imgs/partners/sony-logo.png" },
  { name: "Mercedes", logo: "/imgs/partners/mercedes-logo.png" }
];

interface PartnersScrollProps {
  className?: string;
  speed?: number; // 滚动速度，单位为像素/秒
}

export function PartnersScroll({ className, speed = 30 }: PartnersScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current || !contentRef.current) return;
    
    // 复制内容以实现无缝滚动
    const content = contentRef.current;
    const scrollContainer = scrollRef.current;
    
    // 克隆节点以实现无限滚动效果
    const clone = content.cloneNode(true);
    scrollContainer.appendChild(clone);
    
    let animationId: number;
    let startTime: number;
    let distance = 0;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // 计算滚动距离
      distance = (elapsed * speed) / 1000;
      
      // 当滚动距离超过内容宽度时重置
      if (distance >= content.offsetWidth) {
        distance = 0;
        startTime = timestamp;
      }
      
      // 应用滚动
      scrollContainer.style.transform = `translateX(-${distance}px)`;
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [speed]);

  return (
    <div className={cn("w-full overflow-hidden bg-black py-4", className)}>
      <div ref={scrollRef} className="inline-flex">
        <div ref={contentRef} className="flex items-center space-x-12">
          {partners.map((partner, index) => (
            <div key={index} className="flex items-center justify-center h-12">
              {/* 使用 div 和背景图片作为替代方案，因为我们没有实际的 SVG 文件 */}
              <div 
                className="h-6 w-24 bg-contain bg-center bg-no-repeat opacity-80"
                style={{ 
                  backgroundImage: `url(${partner.logo})`,
                  // 由于实际文件可能不存在，使用内联样式作为备选
                  filter: "brightness(0) invert(1)"
                }}
                aria-label={partner.name}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}