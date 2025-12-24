import { History } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoHistorySkeletonProps {
  className?: string;
}

export default function VideoHistorySkeleton({ className }: VideoHistorySkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gray-800 rounded-xl shadow-lg flex flex-col flex-1 w-full lg:w-auto lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]",
        className
      )}
    >
      {/* Header */}
      <header className="py-3 px-4 md:px-5 flex justify-between items-center border-b border-gray-700">
        <div className="text-lg md:text-xl font-semibold flex items-center text-white min-w-0">
          <History className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 flex-shrink-0" />
          <span className="truncate">Recent Generations</span>
        </div>
        <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
      </header>

      {/* Skeleton Content */}
      <div className="lg:flex-1 lg:overflow-y-auto">
        <div className="divide-y divide-gray-700">
          {/* Skeleton Items */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="px-4 py-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
                {/* Video Thumbnail Skeleton */}
                <div className="relative mb-4 lg:mb-0 lg:flex-shrink-0">
                  <div className="w-full lg:w-64 h-36 lg:h-36 bg-gray-700 rounded-lg animate-pulse" />
                  {/* Status Badge Skeleton */}
                  <div className="absolute top-2 right-2 w-16 h-6 bg-gray-600 rounded animate-pulse" />
                </div>

                {/* Content Skeleton */}
                <div className="flex-1 space-y-3">
                  {/* Prompt Skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2" />
                  </div>

                  {/* Meta Info Skeleton */}
                  <div className="flex flex-wrap gap-4">
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-16" />
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-20" />
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-24" />
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
                    <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
                    <div className="h-8 w-24 bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
