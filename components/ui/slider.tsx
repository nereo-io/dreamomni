"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    { className, value, onValueChange, min = 0, max = 100, step = 1, ...props },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      onValueChange([newValue]);
    };

    const percentage = ((value[0] - min) / (max - min)) * 100;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <div className="relative w-full h-2 bg-secondary rounded-full">
          <div
            className="absolute h-full bg-primary rounded-full"
            style={{ width: `${percentage}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={handleChange}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute w-5 h-5 bg-background border-2 border-primary rounded-full transform -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${percentage}%`, top: "50%" }}
          />
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
