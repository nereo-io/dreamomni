"use client";

import { useState } from "react";
import { ZodiacCalculator } from "./calculator";
import { ZodiacResultCard } from "./result-card";
import { ChineseZodiacPage } from "@/types/pages/chinese-zodiac-caculator";

interface ChineseZodiacProps {
  page: ChineseZodiacPage;
}

export const ChineseZodiac = ({ page }: ChineseZodiacProps) => {
  const [zodiac, setZodiac] = useState<string | null>(null);
  const [element, setElement] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleCalculate = (
    year: number,
    month: number,
    day: number,
    calculatedZodiac: string,
    calculatedElement: string
  ) => {
    setZodiac(calculatedZodiac);
    setElement(calculatedElement);
    setYear(year);
    setShowResult(true);

    // 滚动到结果区域
    setTimeout(() => {
      window.scrollTo({
        top: window.scrollY + 300,
        behavior: "smooth",
      });
    }, 100);
  };

  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <ZodiacCalculator t={page} onCalculate={handleCalculate} />

        {zodiac && element && (
          <ZodiacResultCard
            t={page}
            zodiac={zodiac}
            element={element}
            visible={showResult}
            year={year}
          />
        )}
      </div>
    </div>
  );
};
