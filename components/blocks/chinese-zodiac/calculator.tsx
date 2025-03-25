"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ChineseZodiacPage } from "@/types/pages/chinese-zodiac-calculator";

interface CalculatorProps {
  t: ChineseZodiacPage;
  onCalculate: (
    year: number,
    month: number,
    day: number,
    zodiac: string,
    element: string
  ) => void;
}

// 生肖计算功能
const calculateChineseZodiac = (year: number): string => {
  const zodiacSigns = [
    "rat",
    "ox",
    "tiger",
    "rabbit",
    "dragon",
    "snake",
    "horse",
    "goat",
    "monkey",
    "rooster",
    "dog",
    "pig",
  ];
  return zodiacSigns[(year - 4) % 12];
};

// 五行计算功能
const calculateElement = (year: number): string => {
  const elements = ["wood", "fire", "earth", "metal", "water"];
  const elementNumber = Math.floor(((year - 4) % 10) / 2);
  return elements[elementNumber];
};

export const ZodiacCalculator = ({ t, onCalculate }: CalculatorProps) => {
  const [year, setYear] = useState<number>(new Date().getFullYear() - 18);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [day, setDay] = useState<number>(new Date().getDate());

  const handleCalculate = () => {
    // 计算生肖和五行
    const calculatedZodiac = calculateChineseZodiac(year);
    const calculatedElement = calculateElement(year);

    // 通知父组件
    onCalculate(year, month, day, calculatedZodiac, calculatedElement);

    toast.success(
      `${t.results.yourZodiac} ${
        t.zodiacSigns[calculatedZodiac as keyof typeof t.zodiacSigns]
      }`
    );
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="bg-card">
        <CardTitle className="text-xl text-card-foreground">
          <h2>{t.enterBirthdate}</h2>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          <p>{t.birthdateDescription}</p>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 bg-background">
        <div className="space-y-4">
          <DatePicker
            year={year}
            month={month}
            day={day}
            onYearChange={setYear}
            onMonthChange={setMonth}
            onDayChange={setDay}
          />
        </div>
      </CardContent>
      <CardFooter className="bg-card rounded-b-lg">
        <Button
          onClick={handleCalculate}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {t.calculate}
        </Button>
      </CardFooter>
    </Card>
  );
};
