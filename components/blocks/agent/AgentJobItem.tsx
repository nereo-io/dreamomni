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
import VideoPlayer from '@/components/blocks/video-history/components/VideoPlayer';

interface AgentJobItemProps {
  job: AgentJob;
  onDelete: (jobId: string) => void;
  locale: string;
}

export const AgentJobItem: React.FC<AgentJobItemProps> = React.memo(
  ({ job, onDelete, locale }) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
     const [showLogs, setShowLogs] = useState(false);

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

    // Format timestamp (aligned with video-history/VideoHistoryItem.tsx)
    const formatTimestamp = () => {
      if (!job.created_at) return null;

      const date = new Date(job.created_at);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        return date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
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

    // Download helper functions (aligned with video-history/index.tsx)
    const createProxyDownloadUrl = (sourceUrl: string, filename: string) =>
      `/api/proxy-video?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(filename)}`;

    const triggerDownload = (href: string, filename: string) => {
      const downloadLink = document.createElement('a');
      downloadLink.href = href;
      downloadLink.download = filename;
      downloadLink.rel = 'noopener noreferrer';
      downloadLink.style.cssText =
        'display: none; position: absolute; top: -9999px; left: -9999px;';
      downloadLink.target = '_self';

      document.body.appendChild(downloadLink);

      try {
        downloadLink.click();
      } finally {
        document.body.removeChild(downloadLink);
      }
    };

    const handleDownloadFinal = async () => {
      if (!job.final_video_url) return;

      const filename = `agent_video_${job.id}.mp4`;
      const proxyUrl = createProxyDownloadUrl(job.final_video_url, filename);

      setIsDownloading(true);

      try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error('Empty video blob');
        }

        const objectUrl = window.URL.createObjectURL(blob);
        triggerDownload(objectUrl, filename);
        window.URL.revokeObjectURL(objectUrl);
      } catch (error) {
        console.error('Download failed:', error);
        // Fallback: try direct proxy download
        try {
          triggerDownload(proxyUrl, filename);
        } catch (fallbackError) {
          console.error('Proxy download fallback failed:', fallbackError);
          // Last resort: direct URL (may open in new tab due to CORS)
          triggerDownload(job.final_video_url, filename);
        }
      } finally {
        setIsDownloading(false);
      }
    };

    // Get thumbnail URL (only show user-uploaded reference image)
    const getThumbnailUrl = () => {
      // Only display if user uploaded a reference image
      if (job.reference_image_url) return job.reference_image_url;
      return null;
    };

    const thumbnailUrl = getThumbnailUrl();

    // Story outline & characters (Phase 3.5)
    const storyOutline = (job.story_outline || {}) as any;
    const acts =
      storyOutline.acts && Array.isArray(storyOutline.acts)
        ? storyOutline.acts
        : [];
    const theme = storyOutline.theme;
    const tone = storyOutline.tone;

    const mainCharacters = (job.main_characters || []) as any[];

    const referenceImages =
      job.character_reference_images && job.character_reference_images.length > 0
        ? job.character_reference_images
        : job.reference_image_url
        ? [job.reference_image_url]
        : [];

    return (
      <>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg p-5 space-y-2">
          {/* Header: Status + Thumbnail + Prompt + Timestamp + Actions */}
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Status Badge */}
              <Badge
                className={cn(
                  'text-white text-xs font-semibold px-2.5 py-1 rounded-full border-0 flex-shrink-0',
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

              {/* Thumbnail - User uploaded reference image */}
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="Reference"
                  className="h-7 w-7 rounded-sm object-contain bg-gray-800 flex-shrink-0"
                />
              )}

              {/* Prompt */}
              <p
                className="text-base font-bold text-gray-900 dark:text-white leading-relaxed flex-1 min-w-0"
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
            <div className="flex items-center gap-3 flex-shrink-0">
              {formatTimestamp() && (
                <span className="text-sm text-gray-400">{formatTimestamp()}</span>
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

          {/* Metadata Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-md border-0"
            >
              16:9
            </Badge>
            <Badge
              variant="secondary"
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-md border-0"
            >
              {job.duration_seconds}s
            </Badge>
            <Badge
              variant="secondary"
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-md border-0"
            >
              {job.num_shots} shots
            </Badge>
            {job.video_model && (
              <Badge
                variant="secondary"
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-md border-0"
              >
                {job.video_model === 'kie-veo3-image-to-video' ? 'Veo3' : 'Seedance Pro'}
              </Badge>
            )}
          </div>

          {/* Story outline & main characters summary */}
          {(theme || tone || mainCharacters.length > 0) && (
            <div className="mt-1 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              {(theme || tone) && (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {theme && <span>主题: {theme}</span>}
                  {tone && <span>基调: {tone}</span>}
                  {acts.length > 0 && (
                    <span>章节数: {acts.length}</span>
                  )}
                </div>
              )}

              {mainCharacters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-1">主角:</span>
                  {mainCharacters.slice(0, 3).map((char, index) => (
                    <span
                      key={char?.name || index}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-[11px] text-gray-800 dark:text-gray-100"
                    >
                      {char?.name || `角色 ${index + 1}`}
                    </span>
                  ))}
                  {mainCharacters.length > 3 && (
                    <span className="text-[11px] text-gray-400">
                      +{mainCharacters.length - 3} 更多
                    </span>
                  )}

                  {referenceImages.length > 0 && (
                    <span className="ml-2 text-[11px] text-gray-400">
                      参考图 {referenceImages.length} 张
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Progress Bar (only show during generation, hide on completed/failed) */}
          {job.progress && isProcessing && (
            <div className="space-y-2">
              {/* Keyframes Progress */}
              {job.progress.keyframes && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Keyframes</span>
                    <span>
                      {job.progress.keyframes.done}/{job.progress.keyframes.total}
                      {job.progress.keyframes.failed ? ` (${job.progress.keyframes.failed} failed)` : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{
                        width: `${(job.progress.keyframes.done / job.progress.keyframes.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Videos Progress */}
              {job.progress.videos && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Videos</span>
                    <span>
                      {job.progress.videos.done}/{job.progress.videos.total}
                      {job.progress.videos.failed ? ` (${job.progress.videos.failed} failed)` : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${(job.progress.videos.done / job.progress.videos.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}


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
              storyOutline={job.story_outline || null}
              mainCharacters={job.main_characters || null}
              characterReferenceImages={job.character_reference_images || null}
              locale={locale}
            />
          )}

          {/* Final Video - Using VideoPlayer component */}
          {job.final_video_url && (
            <div className="relative w-full">
              <VideoPlayer
                videoUrl={job.final_video_url}
                onDownload={handleDownloadFinal}
                canDownload={true}
                isDownloading={isDownloading}
              />
              {/* Final Video label overlay */}
              <div className="absolute top-3 left-3 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-md pointer-events-none z-10">
                Final Video
              </div>
            </div>
          )}

          {/* Agent Logs – inline on job list for better visibility */}
          {job.logs && job.logs.length > 0 && (
            <div className="mt-2 bg-gray-950/40 rounded-lg border border-gray-800/60">
              <button
                type="button"
                onClick={() => setShowLogs((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-gray-900/60 transition-colors"
              >
                <span>Agent Logs</span>
                <span className="text-gray-500">
                  {showLogs ? 'Hide' : 'Show'}
                </span>
              </button>
              {showLogs && (
                <div className="px-3 pb-2 max-h-40 overflow-y-auto text-[11px] text-gray-300 space-y-1">
                  {job.logs.map((log) => (
                    <div key={log.timestamp} className="flex gap-2">
                      <span className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
