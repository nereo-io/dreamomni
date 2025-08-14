import React from "react";
import { cn } from "@/lib/utils";

interface TimeDisplayProps {
  seconds: number;
  label?: string;
  className?: string;
  format?: "mm:ss" | "text";
}

const TimeDisplay: React.FC<TimeDisplayProps> = React.memo(({
  seconds,
  label,
  className,
  format = "text"
}) => {
  // Format seconds to readable time
  const formatTime = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return format === "mm:ss" ? "00:00" : "0 seconds";
    
    const minutes = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    
    if (format === "mm:ss") {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Text format
    if (minutes === 0) {
      return `${secs} second${secs !== 1 ? 's' : ''}`;
    } else if (minutes === 1) {
      return secs > 0 ? `1 minute ${secs} second${secs !== 1 ? 's' : ''}` : "1 minute";
    } else {
      return secs > 0 
        ? `${minutes} minutes ${secs} second${secs !== 1 ? 's' : ''}`
        : `${minutes} minutes`;
    }
  };
  
  return (
    <div className={cn("text-sm text-gray-400", className)}>
      {label && <span className="mr-1">{label}</span>}
      <span className="font-medium text-gray-300">
        {formatTime(seconds)}
      </span>
    </div>
  );
});

TimeDisplay.displayName = "TimeDisplay";

export default TimeDisplay;