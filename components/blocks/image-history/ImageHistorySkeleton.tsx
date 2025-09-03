import { Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageHistorySkeletonProps {
  className?: string;
}

export default function ImageHistorySkeleton({ className }: ImageHistorySkeletonProps) {
  return (
    <div className="lg:flex-1 lg:overflow-y-auto">
        {/* Responsive Masonry Grid Skeleton */}
        <div className="p-4">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {/* Skeleton Items */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div 
                key={index} 
                className="break-inside-avoid mb-4"
                style={{
                  // Ensure proper spacing in columns layout
                  display: 'inline-block',
                  width: '100%',
                  marginBottom: '16px'
                }}
              >
                <div className="relative bg-gray-700/50 rounded-xl overflow-hidden animate-pulse">
                  {/* Image Skeleton */}
                  <div 
                    className="w-full bg-gray-600 animate-pulse"
                    style={{
                      height: `${180 + (index % 4) * 60}px` // More varied heights
                    }}
                  />
                  
                  {/* Content Skeleton */}
                  <div className="p-4 space-y-3">
                    {/* Prompt Skeleton */}
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-600 rounded animate-pulse w-full" />
                      <div className="h-3 bg-gray-600 rounded animate-pulse w-4/5" />
                    </div>
                    
                    {/* Meta Info Skeleton */}
                    <div className="flex justify-between items-center text-xs">
                      <div className="h-2 bg-gray-600 rounded animate-pulse w-20" />
                      <div className="h-2 bg-gray-600 rounded animate-pulse w-16" />
                    </div>
                  </div>
                  
                  {/* Status Badge Skeleton (for processing items) */}
                  {index % 4 === 0 && (
                    <div className="absolute top-3 right-3 w-18 h-6 bg-gray-600 rounded-full animate-pulse" />
                  )}
                  
                  {/* Action Buttons Skeleton (hover overlay) */}
                  <div className="absolute inset-0 bg-black/0 opacity-0">
                    <div className="absolute top-3 left-3 flex gap-2">
                      <div className="w-8 h-8 bg-gray-600 rounded animate-pulse" />
                      <div className="w-8 h-8 bg-gray-600 rounded animate-pulse" />
                      <div className="w-8 h-8 bg-gray-600 rounded animate-pulse" />
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
