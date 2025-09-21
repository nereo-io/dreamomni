"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  Step as StepType,
  NanoBananaUsageGuideProps,
} from "@/types/pages/nano-banana";

const Step: React.FC<StepType> = ({ number, title, description }) => {
  return (
    <div className="bg-gray-800/80 backdrop-blur-md rounded-xl p-8 flex flex-col border border-gray-700/50 transition-all duration-300 hover:bg-gray-800/90 hover:-translate-y-1 h-full">
      <div className="text-5xl font-black mb-4 text-white bg-clip-text text-transparent">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-3 tracking-tight">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
};

export default function NanoBananaUsageGuide({
  section,
}: NanoBananaUsageGuideProps) {
  // 背景已改为纯色，移除视差滚动效果代码

  return (
    <div className="text-white py-12 usage-guide-section">
      <div className="container mx-auto px-4">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-black mb-10 text-center text-white">
            {section.title}
          </h1>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {section.description}
          </p>
        </div>

        {/* 步骤卡片区域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {section.steps.map((step, index) => (
            <div
              key={index}
              className="animate-fade-in-up h-full"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <Step
                number={step.number}
                title={step.title}
                description={step.description}
              />
            </div>
          ))}
        </div>

        {/* 按钮区域 */}
        <div className="flex justify-center">
          <Link href="/ai-image-generator" className="group">
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "w-full sm:w-auto py-6 px-8 text-lg font-medium text-white",
                "border-2 border-white/80 rounded-full",
                "hover:bg-gray-800/90 transition-all duration-500 ease-out",
                "relative overflow-hidden group-hover:scale-105",
                "shadow-lg hover:shadow-2xl hover:shadow-purple-500/30"
              )}
            >
              {/* Purple fill effect on hover */}
              <span className="absolute w-full h-full bg-purple-600 left-[-100%] top-0 group-hover:left-0 transition-all duration-700 ease-out" />
              <span className="relative z-10 flex items-center gap-2">
                {section.buttonText}
              </span>
              {/* Purple glow effect on hover */}
              <span
                className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                aria-hidden="true"
              ></span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
