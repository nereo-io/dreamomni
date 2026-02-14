interface ImageHistorySkeletonProps {
  className?: string;
}

export default function ImageHistorySkeleton({ className }: ImageHistorySkeletonProps) {
  return (
    <div className={`lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar ${className || ""}`}>
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 shadow-sm animate-pulse"
            >
              <div className="relative aspect-[4/3] bg-gray-800">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/40 via-gray-800/40 to-gray-900/60" />
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-gray-700/70" />
                  <div className="h-9 w-9 rounded-full bg-gray-700/70" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
