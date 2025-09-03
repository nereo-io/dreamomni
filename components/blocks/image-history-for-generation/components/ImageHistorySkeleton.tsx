interface ImageHistorySkeletonProps {
  className?: string;
}

export default function ImageHistorySkeleton({ className }: ImageHistorySkeletonProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="space-y-4">
        {/* Skeleton Items */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div 
            key={index} 
            className="p-5 space-y-4 animate-pulse"
          >
            {/* Header: Status Badge + Prompt + Copy Button + Timestamp */}
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-start gap-3 flex-1">
                {/* Status Badge */}
                <div className="h-6 bg-gray-600 rounded-full w-20 flex-shrink-0 mt-0.5" />
                
                {/* Prompt + Copy Button */}
                <div className="flex items-start gap-2 flex-1">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-600 rounded w-full" />
                    <div className="h-4 bg-gray-600 rounded w-3/4" />
                  </div>
                  {/* Copy Button */}
                  <div className="h-6 w-6 bg-gray-600 rounded flex-shrink-0 mt-0.5" />
                </div>
              </div>
              {/* Timestamp */}
              <div className="h-4 bg-gray-600 rounded w-12 flex-shrink-0 mt-0.5" />
            </div>

            {/* Metadata tags */}
            <div className="flex gap-2">
              <div className="h-5 bg-gray-600 rounded w-16" />
              <div className="h-5 bg-gray-600 rounded w-32" />
            </div>

            {/* Enhanced Prompt section (optional) */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-600 rounded w-24" />
              <div className="h-3 bg-gray-600 rounded w-full" />
            </div>

            {/* Image Status Display */}
            <div className="space-y-3">
              {/* Image preview - 2/3 width, left aligned */}
              <div className="flex justify-start">
                <div className="w-2/3 aspect-square bg-gray-600 rounded-lg" />
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-600 rounded w-16" />
                  <div className="h-8 w-8 bg-gray-600 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-600 rounded" />
                  <div className="h-8 w-8 bg-gray-600 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
