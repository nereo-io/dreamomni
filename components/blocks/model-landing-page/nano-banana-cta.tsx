"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { NanoBananaCtaProps } from "@/types/pages/nano-banana";

export default function NanoBananaCta({ section }: NanoBananaCtaProps) {
  // Enhanced glow effect for the logo with purple color
  const glowStyle = useMemo(() => {
    // Base glow with purple gradient colors
    return {
      filter:
        "drop-shadow(0 0 10px rgba(192, 132, 252, 0.6)) drop-shadow(0 0 20px rgba(192, 132, 252, 0.4)) drop-shadow(0 0 40px rgba(192, 132, 252, 0.2))",
      animation: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate",
    };
  }, []);

  // Enhanced glow effect on hover
  const hoverGlowStyle = useMemo(() => {
    return {
      filter:
        "drop-shadow(0 0 15px rgba(192, 132, 252, 0.8)) drop-shadow(0 0 30px rgba(192, 132, 252, 0.6)) drop-shadow(0 0 50px rgba(192, 132, 252, 0.4))",
    };
  }, []);

  return (
    <div className="relative w-full min-h-[60vh] bg-black text-white overflow-hidden font-sans">
      {/* Enhanced Background Glows with more dynamic effects */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-full filter blur-[100px] opacity-20 animate-pulse"
        style={{ animationDuration: "8s" }}
      ></div>
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-tl from-green-400 via-teal-500 to-blue-500 rounded-full filter blur-[100px] opacity-20 animate-pulse"
        style={{ animationDuration: "10s", animationDelay: "1s" }}
      ></div>

      {/* Additional central glow for depth */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full filter blur-[120px]"></div>

      {/* Grid pattern overlay for texture */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtMS4zNiAwLTIuNS0xLjEyNS0yLjUtMi41cyAxLjE0LTIuNSAyLjUtMi41IDIuNSAxLjEyNSAyLjUgMi41LTEuMTQgMi41LTIuNSAyLjV6IiBzdHJva2Utb3BhY2l0eT0iLjAyIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-4 py-16">
        {/* Logo with enhanced animation and interactive effects */}
        <div className="flex items-center justify-center mb-12">
          {/* Simplified logo container */}
          <div className="transition-all duration-700 hover:scale-105 group">
            {/* Main logo */}
            <Image
              src="/logo.png"
              alt="Pollo AI Logo"
              width={80}
              height={80}
              className="transition-all duration-300 group-hover:brightness-110"
              style={glowStyle}
            />
          </div>
        </div>

        {/* Title with adjusted typography */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 leading-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-pink-200 animate-fade-in">
          {section.title}
        </h1>

        {/* CTA Button with enhanced effects */}
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
