'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionSelectorSkeleton() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="rounded-lg p-6">
        <div className="space-y-4">
          {/* 标题骨架 */}
          <Skeleton className="h-8 w-3/4 mx-auto" />
          {/* 副标题骨架 */}
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
        <div className="space-y-8 mt-8">
          {/* 分类选项骨架 */}
          <div className="flex gap-4 justify-center">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-10 w-24"
              />
            ))}
          </div>
          
          {/* 问题选项骨架 */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ))}
          </div>

          {/* 按钮骨架 */}
          <Skeleton className="h-12 w-full mt-6" />
        </div>
      </div>
    </div>
  );
} 