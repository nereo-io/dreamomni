interface ImageHistorySkeletonProps {
  className?: string;
}

export default function ImageHistorySkeleton({ className }: ImageHistorySkeletonProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-gray-700">
        {/* Skeleton Items - 只显示3个 */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div 
            key={index} 
            className="px-4 py-5 space-y-4 animate-pulse"
          >
            {/* 提示词 + 时间戳 */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
              </div>
              {/* 时间戳 */}
              <div className="h-4 bg-gray-700 rounded w-16" />
            </div>

            {/* 图片占位符 */}
            <div className="w-2/3 aspect-square bg-gray-700 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
