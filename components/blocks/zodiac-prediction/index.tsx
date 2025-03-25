"use client";

import { useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ZodiacPredictionProps {
  zodiacSign: string;
  predictionText: string;
  years: string;
  className?: string;
}

export const ZodiacPrediction = ({
  zodiacSign,
  predictionText,
  years,
  className = "",
}: ZodiacPredictionProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // 为每种生肖设置独特的配色
  const colorSchemes: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    rat: { bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-200" },
    ox: {
      bg: "bg-yellow-50",
      text: "text-yellow-800",
      border: "border-yellow-200",
    },
    tiger: {
      bg: "bg-orange-50",
      text: "text-orange-800",
      border: "border-orange-200",
    },
    rabbit: {
      bg: "bg-green-50",
      text: "text-green-800",
      border: "border-green-200",
    },
    dragon: {
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-200",
    },
    snake: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200" },
    horse: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
    },
    goat: {
      bg: "bg-indigo-50",
      text: "text-indigo-800",
      border: "border-indigo-200",
    },
    monkey: {
      bg: "bg-purple-50",
      text: "text-purple-800",
      border: "border-purple-200",
    },
    rooster: {
      bg: "bg-pink-50",
      text: "text-pink-800",
      border: "border-pink-200",
    },
    dog: { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
    pig: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
    },
  };

  // 处理生肖名称，确保小写并处理"goat"和"sheep"的一致性
  const normalizedSign = zodiacSign.toLowerCase();
  const sign = normalizedSign === "goat" ? "sheep" : normalizedSign;

  // 获取当前生肖的配色，如果没有指定则使用默认配色
  const { bg, text, border } = colorSchemes[sign] || {
    bg: "bg-gray-50",
    text: "text-gray-800",
    border: "border-gray-200",
  };

  return (
    <div
      id={`zodiac-${sign}`}
      className={`p-6 rounded-lg shadow-md ${bg} ${className}`}
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-32 h-32 flex-shrink-0">
          <Image
            src={`/imgs/zodiac/${sign}.png`}
            alt={zodiacSign}
            width={128}
            height={128}
            className="object-contain"
          />
        </div>

        <div className="flex-1">
          <h3 className={`text-2xl font-bold mb-2 ${text}`}>{zodiacSign}</h3>
          <p className="text-gray-600 mb-4">出生年份: {years}</p>

          <Tabs defaultValue="overview" onValueChange={setActiveTab}>
            <TabsList className={`grid grid-cols-4 mb-6 ${border}`}>
              <TabsTrigger value="overview">概述</TabsTrigger>
              <TabsTrigger value="career">事业</TabsTrigger>
              <TabsTrigger value="love">爱情</TabsTrigger>
              <TabsTrigger value="health">健康</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <h4 className={`text-lg font-semibold ${text}`}>
                2025木蛇年总体运势
              </h4>
              <p className="text-gray-700">{predictionText}</p>
            </TabsContent>

            <TabsContent value="career" className="space-y-4">
              <h4 className={`text-lg font-semibold ${text}`}>事业运势</h4>
              <p className="text-gray-700">
                2025年对{zodiacSign}
                的事业发展是充满机遇的一年。木蛇年的能量将帮助您实现职业目标，
                尤其是在需要战略思考和深度分析的领域。期待意外的晋升机会或业务合作。
              </p>
            </TabsContent>

            <TabsContent value="love" className="space-y-4">
              <h4 className={`text-lg font-semibold ${text}`}>爱情运势</h4>
              <p className="text-gray-700">
                感情方面，2025年将为{zodiacSign}
                带来深刻的连接。已有伴侣的人会发现关系更加和谐， 单身的
                {zodiacSign}可能会遇到具有深度和智慧的人，这种关系将是变革性的。
              </p>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <h4 className={`text-lg font-semibold ${text}`}>健康运势</h4>
              <p className="text-gray-700">
                2025年，{zodiacSign}
                应该特别关注身心平衡。木蛇年的能量可能带来压力，
                定期放松、冥想和适当的身体活动对于保持健康至关重要。注意饮食习惯也会带来显著好处。
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
