/**
 * AgentJobItem
 * Single job card component for Agent jobs list
 * References: video-history/components/VideoHistoryItem.tsx
 */

"use client";

import React, { useState } from 'react';
import { AgentJob, AgentJobStatusMap } from '@/types/agent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Trash2, Download } from 'lucide-react';
import DeleteConfirmDialog from '@/components/blocks/image-history-for-generation/components/DeleteConfirmDialog';
import { AgentAssetGrid } from './AgentAssetGrid';

interface AgentJobItemProps {
  job: AgentJob;
  onDelete: (jobId: string) => void;
  locale: string;
}

export const AgentJobItem: React.FC<AgentJobItemProps> = React.memo(
  ({ job, onDelete, locale }) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get status info
    const statusInfo = AgentJobStatusMap[job.status] || AgentJobStatusMap.pending;
    const isCompleted = job.status === 'completed';
    const isFailed = job.status === 'failed';
    const isProcessing = [
      'pending',
      'splitting_shots',
      'generating_keyframes',
      'orchestrating_videos',
      'generating_videos',
      'splicing',
    ].includes(job.status);

    // Format timestamp
    const formatTimestamp = () => {
      if (!job.created_at) return null;

      const date = new Date(job.created_at);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return `${diffInMinutes} min ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hr ago`;
      } else {
        return date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        });
      }
    };

    const handleDelete = () => {
      setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
      setIsDeleting(true);
      await onDelete(job.id);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    };

    const handleDownloadFinal = () => {
      if (job.final_video_url) {
        const link = document.createElement('a');
        link.href = job.final_video_url;
        link.download = `agent_video_${job.id}.mp4`;
        link.click();
      }
    };

    return (
      <>
        <div className="bg-gray-900 rounded-xl shadow-lg p-5 space-y-4">
          {/* Header: Status + Prompt + Timestamp + Actions */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-start gap-3 flex-1">
              {/* Status Badge */}
              <Badge
                className={cn(
                  'text-white text-xs font-semibold px-2.5 py-1 rounded-full border-0 flex-shrink-0 mt-0.5',
                  isCompleted
                    ? 'bg-green-500 text-green-900'
                    : isFailed
                    ? 'bg-red-500 text-red-900'
                    : 'bg-blue-500 text-blue-900'
                )}
              >
                {isProcessing && <Loader2 className="h-3 w-3 mr-1 animate-spin inline" />}
                {statusInfo.label}
              </Badge>

              {/* Prompt */}
              <p
                className="text-base font-bold text-white leading-relaxed flex-1"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {job.prompt}
              </p>
            </div>

            {/* Timestamp and Actions */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {formatTimestamp() && (
                <span className="text-sm text-gray-400">{formatTimestamp()}</span>
              )}

              <div className="flex gap-2">
                {job.final_video_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadFinal}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Metadata Tags */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border-0"
            >
              16:9
            </Badge>
            <Badge
              variant="secondary"
              className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border-0"
            >
              {job.duration_seconds}s
            </Badge>
            <Badge
              variant="secondary"
              className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border-0"
            >
              {job.num_shots} shots
            </Badge>
            {job.video_model && (
              <div className="text-gray-300 flex-1 text-sm leading-relaxed">
                {job.video_model === 'kie-veo3-image-to-video' ? 'Veo3' : 'Seedance Pro'}
              </div>
            )}
          </div>

          {/* Error message for failed jobs */}
          {isFailed && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg p-3">
              ⚠️ Generation failed
            </div>
          )}

          {/* Assets Grid */}
          {job.shots && job.shots.length > 0 && (
            <AgentAssetGrid
              shots={job.shots}
              finalVideoUrl={job.final_video_url}
              locale={locale}
            />
          )}
        </div>

        {/* Delete confirmation dialog */}
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          title="Delete Agent Job?"
          description={`Are you sure you want to delete "${job.prompt.substring(0, 50)}..."? This action cannot be undone.`}
        />
      </>
    );
  }
);

AgentJobItem.displayName = 'AgentJobItem';
