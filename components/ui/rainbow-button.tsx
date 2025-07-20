import { cn } from "@/lib/utils";
import React from "react";

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function RainbowButton({ 
  children, 
  className,
  ...props 
}: RainbowButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center px-8 py-4",
        "text-white font-semibold text-lg rounded-xl",
        "bg-black/90 backdrop-blur-sm",
        "overflow-hidden group",
        "transition-all duration-300 transform hover:scale-105",
        className
      )}
      {...props}
    >
      {/* Animated rainbow gradient border */}
      <span className="absolute inset-0 w-full h-full rounded-xl">
        <span 
          className="absolute inset-0 w-full h-full rounded-xl opacity-75 blur-sm"
          style={{
            background: "linear-gradient(90deg, #ff0080, #ff8c00, #ffd700, #00ff00, #00ffff, #0080ff, #8000ff)",
            backgroundSize: "200% 100%",
            animation: "gradient 3s ease infinite",
          }}
        />
      </span>
      
      {/* Inner black background */}
      <span className="absolute inset-[2px] bg-black/90 rounded-xl" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center">
        {children}
      </span>
      
      {/* Hover glow effect */}
      <span 
        className="absolute inset-0 w-full h-full rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"
        style={{
          background: "linear-gradient(90deg, #ff0080, #ff8c00, #ffd700, #00ff00, #00ffff, #0080ff, #8000ff)",
          backgroundSize: "200% 100%",
          animation: "gradient 3s ease infinite",
        }}
      />
    </button>
  );
}