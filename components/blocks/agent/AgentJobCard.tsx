/**
 * AgentJobCard
 * Card component for displaying an Agent job in the list view
 */

"use client";

import { AgentJob, AgentJobStatusMap } from '@/types/agent';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Film, Trash2, Eye, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AgentJobCardProps {
  job: AgentJob;
  onDelete?: (job: AgentJob) => void;
  isDeleting?: boolean;
}

export function AgentJobCard({ job, onDelete, isDeleting = false }: AgentJobCardProps) {
  const router = useRouter();
  const statusInfo = AgentJobStatusMap[job.status] || { label: job.status, color: 'gray' };

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

  const isActive = !['completed', 'failed'].includes(job.status);

  const handleCardClick = () => {
    router.push(`/agent/${job.id}`);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/agent/${job.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(job);
    }
  };

  return (
    <Card
      className={cn(
        "bg-gray-700/50 border-gray-700 text-gray-200 flex flex-col transition-all duration-200 cursor-pointer",
        "hover:bg-gray-700/70 hover:border-gray-600"
      )}
      onClick={handleCardClick}
    >
      <CardHeader>
        {/* Status badge and timestamp */}
        <div className="flex items-start justify-between mb-3">
          <Badge
            variant={getStatusBadgeVariant(job.status)}
            className={cn(
              "flex items-center gap-1",
              job.status === 'completed' && "bg-green-600 hover:bg-green-700 text-white border-transparent"
            )}
          >
            {isActive && <Loader2 className="h-3 w-3 animate-spin" />}
            {statusInfo.label}
          </Badge>
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Thumbnail or placeholder */}
        <div className="aspect-video bg-gray-700 rounded-md mb-3 flex items-center justify-center overflow-hidden relative">
          {job.reference_image_url ? (
            <img
              src={job.reference_image_url}
              alt="Reference"
              className="w-full h-full object-cover"
            />
          ) : job.final_video_url ? (
            <video
              src={job.final_video_url}
              poster={job.reference_image_url}
              className="w-full h-full object-cover"
              preload="auto"
              controls={false}
            />
          ) : (
            <Film className="h-16 w-16 text-gray-500" />
          )}

          {/* Shot count badge */}
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="secondary"
              className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700 border-blue-200"
            >
              {job.num_shots} shots
            </Badge>
          </div>
        </div>

        {/* Prompt */}
        <CardTitle className="text-lg line-clamp-2" title={job.prompt}>
          {job.prompt}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-grow space-y-2">
        {/* Metadata */}
        <div className="space-y-1">
          <p className="text-sm text-gray-400">
            Duration: {job.duration_seconds}s
          </p>
          <p className="text-sm text-gray-400">
            Shots: {job.num_shots}
          </p>
          <p className="text-sm text-gray-400">
            Credits: {job.credits_charged}
          </p>
        </div>

        {/* Progress (if available) */}
        {job.progress && (
          <div className="pt-2 space-y-1 text-xs text-gray-400">
            {job.progress.keyframes && (
              <div className="flex justify-between">
                <span>Keyframes:</span>
                <span>
                  {job.progress.keyframes.done}/{job.progress.keyframes.total}
                </span>
              </div>
            )}
            {job.progress.videos && (
              <div className="flex justify-between">
                <span>Videos:</span>
                <span>
                  {job.progress.videos.done}/{job.progress.videos.total}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-2 pt-4 border-t border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewDetails}
          className="flex-1 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
