import { Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageHistorySkeletonProps {
  className?: string;
}

export default function ImageHistorySkeleton({ className }: ImageHistorySkeletonProps) {
  return (
    <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
      {/* Grid Layout consistent with actual ImageHistory */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Skeleton Items */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div 
              key={index} 
              className="bg-gray-700/50 border-gray-700 rounded-lg flex flex-col animate-pulse"
            >
              {/* CardHeader Skeleton */}
              <div className="p-6">
                {/* Image Preview Skeleton */}
                <div className="aspect-square bg-gray-700 rounded-md mb-3" />
                
                {/* Title with Copy Button Skeleton */}
                <div className="flex items-start gap-2">
                  <div className="h-5 bg-gray-600 rounded flex-1" />
                  <div className="h-8 w-8 bg-gray-600 rounded flex-shrink-0" />
                </div>
              </div>
              
              {/* CardContent Skeleton */}
              <div className="px-6 flex-grow space-y-3">
                {/* Status and Date */}
                <div className="flex justify-between items-center mb-2">
                  <div className="h-5 bg-gray-600 rounded-full w-20" />
                  <div className="h-3 bg-gray-600 rounded w-16" />
                </div>
                
                {/* Model Info */}
                <div className="h-3 bg-gray-600 rounded w-32" />
                
                {/* Aspect Ratio */}
                <div className="h-1" />
              </div>
              
              {/* CardFooter Skeleton */}
              <div className="flex flex-col sm:flex-row justify-between gap-2 p-6 pt-4 border-t border-gray-700">
                <div className="h-8 bg-gray-600 rounded w-20" />
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="h-8 w-8 bg-gray-600 rounded" />
                  <div className="h-8 w-8 bg-gray-600 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
