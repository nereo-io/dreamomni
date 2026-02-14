/**
 * AgentJobSkeleton
 * Loading skeleton for Agent job cards and details
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface AgentJobSkeletonProps {
  variant?: 'card' | 'detail' | 'list';
  count?: number;
}

export function AgentJobSkeleton({ variant = 'card', count = 1 }: AgentJobSkeletonProps) {
  if (variant === 'card') {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="p-6 space-y-4">
            {/* Header: Status badge + timestamp */}
            <div className="flex items-start justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </Card>
        ))}
      </>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
            <Skeleton className="h-6 w-32" />
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </Card>

        {/* Progress */}
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="p-6 space-y-4">
          <div className="flex gap-2 border-b">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>

          {/* Content area */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return null;
}
