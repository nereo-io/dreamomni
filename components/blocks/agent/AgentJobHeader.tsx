/**
 * AgentJobHeader
 * Header section for Agent job detail page with status, actions, and progress
 */

"use client";

import { AgentJob, AgentJobStatusMap } from '@/types/agent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Trash2,
  RotateCcw,
  Download,
  Calendar,
  Clock,
  Film,
  Coins,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface AgentJobHeaderProps {
  job: AgentJob;
  onDelete?: () => void;
  onRetry?: () => void;
  onDownloadFinal?: () => void;
  isDeleting?: boolean;
  isRetrying?: boolean;
}

export function AgentJobHeader({
  job,
  onDelete,
  onRetry,
  onDownloadFinal,
  isDeleting = false,
  isRetrying = false,
}: AgentJobHeaderProps) {
  const statusInfo = AgentJobStatusMap[job.status] || { label: job.status, color: 'gray' };
  const isActive = !['completed', 'failed'].includes(job.status);

  const getStatusBadgeVariant = (status: AgentJob['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'waiting_for_confirmation':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const calculateProgress = (done: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((done / total) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Main Header Card */}
      <Card className="bg-gray-800 border-gray-700 text-gray-200">
        <CardContent className="p-6 space-y-4">
          {/* Status and timestamp */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Badge
                variant={getStatusBadgeVariant(job.status)}
                className={cn(
                  'flex items-center gap-1 w-fit mb-3',
                  job.status === 'completed' &&
                    'bg-green-600 hover:bg-green-700 text-white border-transparent'
                )}
              >
                {isActive && <Loader2 className="h-3 w-3 animate-spin" />}
                {statusInfo.label}
              </Badge>

              {/* Prompt */}
              <h1 className="text-2xl font-bold text-gray-100 mb-2">{job.prompt}</h1>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {job.duration_seconds}s total
                </div>
                <div className="flex items-center gap-1">
                  <Film className="h-4 w-4" />
                  {job.num_shots} shots
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  {job.credits_charged} credits
                </div>
              </div>
            </div>

            {/* Reference image thumbnail */}
            {job.reference_image_url && (
              <div className="w-32 h-32 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={job.reference_image_url}
                  alt="Reference"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
            {job.final_video_url && (
              <Button
                onClick={onDownloadFinal}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Final Video
              </Button>
            )}

            {job.status === 'failed' && onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Job
                  </>
                )}
              </Button>
            )}

            {onDelete && (
              <Button
                onClick={onDelete}
                disabled={isDeleting}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white ml-auto"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Card */}
      {job.progress && (job.progress.keyframes || job.progress.videos) && (
        <Card className="bg-gray-800 border-gray-700 text-gray-200">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Generation Progress</h3>

            {/* Keyframes Progress */}
            {job.progress.keyframes && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Keyframes</span>
                  <span className="text-gray-400">
                    {job.progress.keyframes.done}/{job.progress.keyframes.total}
                    {job.progress.keyframes.failed ? (
                      <span className="text-red-400 ml-2">
                        ({job.progress.keyframes.failed} failed)
                      </span>
                    ) : null}
                  </span>
                </div>
                <Progress
                  value={calculateProgress(
                    job.progress.keyframes.done,
                    job.progress.keyframes.total
                  )}
                  className="h-2 bg-gray-700"
                />
              </div>
            )}

            {/* Videos Progress */}
            {job.progress.videos && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Videos</span>
                  <span className="text-gray-400">
                    {job.progress.videos.done}/{job.progress.videos.total}
                    {job.progress.videos.failed ? (
                      <span className="text-red-400 ml-2">
                        ({job.progress.videos.failed} failed)
                      </span>
                    ) : null}
                  </span>
                </div>
                <Progress
                  value={calculateProgress(job.progress.videos.done, job.progress.videos.total)}
                  className="h-2 bg-gray-700"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
