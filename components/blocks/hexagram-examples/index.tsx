"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTheme } from "next-themes";

interface HexagramExample {
  number: number;
  name: string;
  description: string;
  image?: string;
}

interface HexagramExamplesProps {
  section: {
    title: string;
    subtitle: string;
    description: string;
    examples: HexagramExample[];
  };
  className?: string;
}

export default function HexagramExamples({ section, className }: HexagramExamplesProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className={cn("py-16", className)}>
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {section.title}
          </h2>
          <p className="max-w-[700px] text-slate-500 md:text-xl dark:text-slate-400">
            {section.subtitle}
          </p>
          <p className="max-w-[900px] mt-4">
            {section.description}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {section.examples.map((example, index) => (
            <div 
              key={index}
              className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">
                {example.image ? (
                  <Image 
                    src={example.image} 
                    alt={example.name} 
                    width={80} 
                    height={120} 
                    className="object-contain"
                  />
                ) : (
                  <HexagramSvg number={example.number} isDark={isDark} />
                )}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">
                  {example.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {example.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Helper component to render a hexagram SVG
function HexagramSvg({ number, isDark }: { number: number; isDark: boolean }) {
  // Simple algorithm to generate a unique hexagram pattern based on the number
  // In a real implementation, you would use actual I Ching hexagram patterns
  const getLineType = (position: number): "yin" | "yang" => {
    // This is a simplified algorithm just for demonstration
    // In reality, you would use the actual hexagram patterns
    const seed = number * (position + 1);
    return seed % 2 === 0 ? "yin" : "yang";
  };

  const lineColor = isDark ? "#f8fafc" : "#0f172a";

  return (
    <svg width="60" height="90" viewBox="0 0 60 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {[0, 1, 2, 3, 4, 5].map((position) => {
        const y = position * 16;
        const lineType = getLineType(position);
        
        return lineType === "yang" ? (
          // Yang line (solid)
          <rect key={position} y={y} width="60" height="8" fill={lineColor} />
        ) : (
          // Yin line (broken)
          <>
            <rect key={`${position}-left`} y={y} width="25" height="8" fill={lineColor} />
            <rect key={`${position}-right`} y={y} x="35" width="25" height="8" fill={lineColor} />
          </>
        );
      })}
    </svg>
  );
}
