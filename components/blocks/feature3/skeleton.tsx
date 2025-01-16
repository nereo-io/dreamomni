'use client';

import { Skeleton } from "@/components/ui/skeleton";

export default function Feature3Skeleton() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* 标题骨架 */}
      <div className="space-y-4 text-center mb-16">
        <Skeleton className="h-8 w-1/3 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto opacity-50" />
      </div>

      {/* 特性列表骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-6 flex flex-col items-center">
            {/* 图标骨架 */}
            <Skeleton className="h-16 w-16 rounded-full opacity-70" />
            {/* 标题骨架 */}
            <Skeleton className="h-6 w-2/3 opacity-80" />
            {/* 描述骨架 */}
            <div className="space-y-3 w-full">
              <Skeleton className="h-4 w-full opacity-60" />
              <Skeleton className="h-4 w-4/5 opacity-50" />
              <Skeleton className="h-4 w-3/4 opacity-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 