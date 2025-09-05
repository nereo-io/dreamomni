interface VideoHistorySkeletonProps {
  className?: string;
}

export default function VideoHistorySkeleton({ className }: VideoHistorySkeletonProps) {
  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Skeleton Items */}
        {Array.from({ length: 8 }).map((_, index) => (
          <div 
            key={index} 
            className="bg-gray-700/50 border-gray-700 rounded-lg flex flex-col animate-pulse"
          >
            {/* Video Thumbnail Skeleton */}
            <div className="p-6">
              <div className="aspect-video bg-gray-600 rounded-md mb-3 animate-pulse" />
              
              {/* Title Skeleton */}
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-600 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-600 rounded animate-pulse w-3/4" />
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="px-6 flex-grow space-y-3">
              {/* Status and Date */}
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-600 rounded-full animate-pulse w-20" />
                <div className="h-3 bg-gray-600 rounded animate-pulse w-16" />
              </div>
              
              {/* Model Info */}
              <div className="h-3 bg-gray-600 rounded animate-pulse w-32" />
              
              {/* Duration */}
              <div className="h-3 bg-gray-600 rounded animate-pulse w-24" />
              
              {/* Aspect Ratio */}
              <div className="h-3 bg-gray-600 rounded animate-pulse w-20" />
            </div>
            
            {/* Footer Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between gap-2 p-6 pt-4 border-t border-gray-700 mt-4">
              <div className="h-8 bg-gray-600 rounded animate-pulse w-20" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-600 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-600 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
