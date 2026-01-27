/**
 * AgentJobItem
 * Single job card component for Agent jobs list
 * References: video-history/components/VideoHistoryItem.tsx
 */

"use client";

import React, { useEffect, useState, useRef } from 'react';
import { AgentAsset, AgentJob, AgentJobStatusMap } from '@/types/agent';
import { resumeAgentJob, retryAgentJob } from '@/lib/agent-api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Trash2, Edit, Copy, Play, RotateCcw, Zap } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/components/blocks/image-history-for-generation/components/DeleteConfirmDialog';
import { AgentAssetGrid } from './AgentAssetGrid';
import VideoPlayer from '@/components/blocks/video-history/components/VideoPlayer';
import { getVideoModel } from '@/config/video-models';
import { useTranslations } from 'next-intl';
import { buildAgentAssetDownloadUrl } from '@/utils/agent-download';
import { trackPlausibleEvent } from '@/utils/plausible';
import useCredits from '@/hooks/useCredits';
import { useAppContext } from '@/contexts/app';

// Timeout for resume operation - if job is still failed after this time, reset UI
const RESUME_TIMEOUT_MS = 60 * 1000; // 60 seconds

interface AgentJobItemProps {
  job: AgentJob;
  onDelete: (jobId: string) => void;
  onReEdit?: (job: AgentJob) => void;
  onJobResumed?: (jobId: string) => void;
  locale: string;
  isReadOnly?: boolean;
}

export const AgentJobItem: React.FC<AgentJobItemProps> = React.memo(
  ({ job, onDelete, onReEdit, onJobResumed, locale, isReadOnly }) => {
    const t = useTranslations("agentJobs");
    const { setShowPricingModal } = useAppContext();
    const { leftCredits, updateLeftCredits, hasInitialized } = useCredits();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isResuming, setIsResuming] = useState(false);
    const [hasResumed, setHasResumed] = useState(false); // Optimistic state for resume
    const resumedAtRef = useRef<number | null>(null); // Track when resume was initiated for timeout
    // const [isRetrying, setIsRetrying] = useState(false); // Retry removed per design
    const [downloadingTarget, setDownloadingTarget] = useState<string | null>(null);
    const [showLogs, setShowLogs] = useState(false);
    const [finalAsset, setFinalAsset] = useState<AgentAsset | null>(null);
    const [finalWithBgmAsset, setFinalWithBgmAsset] = useState<AgentAsset | null>(null);
    const showAgentInternals = process.env.NEXT_PUBLIC_AGENT_INTERNALS === 'true';

    useEffect(() => {
        updateLeftCredits();
    }, [updateLeftCredits]);

    // Reset optimistic resumed state when job status actually changes
    useEffect(() => {
      if (job.status !== 'failed') {
        setHasResumed(false);
        resumedAtRef.current = null; // Clear timeout tracking when status changes
      }
    }, [job.status]);

    // Timeout check: if job is still failed after RESUME_TIMEOUT_MS, reset hasResumed
    // This ensures UI returns to failed state if resume operation didn't work
    useEffect(() => {
      if (!hasResumed || !resumedAtRef.current) return;

      const checkTimeout = () => {
        if (resumedAtRef.current && Date.now() - resumedAtRef.current > RESUME_TIMEOUT_MS) {
          // Timeout reached and job is still failed, reset to show Continue button again
          if (job.status === 'failed') {
            setHasResumed(false);
            resumedAtRef.current = null;
            console.log(`Resume timeout for job ${job.id}, resetting to failed state`);
          }
        }
      };

      // Check every 5 seconds
      const intervalId = setInterval(checkTimeout, 5000);

      // Also check immediately in case we're past the timeout already
      checkTimeout();

      return () => clearInterval(intervalId);
    }, [hasResumed, job.status, job.id]);

    // Get status info
    const statusInfo = AgentJobStatusMap[job.status] || AgentJobStatusMap.pending;
    const isCompleted = job.status === 'completed';
    const isFailed = job.status === 'failed';
    
    // UI Logic: Override failed state if user just clicked Resume
    const isVisualFailed = isFailed && !hasResumed;
    
    const isProcessing = [
      'pending',
      'generating_script',
      'generating_characters',
      'splitting_shots',
      'generating_keyframes',
      'orchestrating_videos',
      'generating_videos',
      'splicing',
    ].includes(job.status) || hasResumed;

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

    const handleResume = async () => {
      try {
        setIsResuming(true);
        setHasResumed(true); // Optimistic update
        resumedAtRef.current = Date.now(); // Record resume time for timeout tracking
        await resumeAgentJob(job.id);
        toast.success(t("item.resumeStarted") || "Resume started");
        onJobResumed?.(job.id);
      } catch (error: any) {
        setHasResumed(false); // Revert on error
        resumedAtRef.current = null; // Clear timeout tracking on error
        console.error("Resume failed:", error);
        toast.error(error.message || t("item.resumeFailed") || "Resume failed");
      } finally {
        setIsResuming(false);
      }
    };

    const handleRecharge = () => {
        setShowPricingModal(true);
    };

    /* Retry logic removed per design requirement
    const handleRetry = async () => {
      try {
        setIsRetrying(true);
        await retryAgentJob(job.id);
        toast.success(t("item.retryStarted") || "Retry started");
      } catch (error: any) {
        console.error("Retry failed:", error);
        toast.error(error.message || t("item.retryFailed") || "Retry failed");
      } finally {
        setIsRetrying(false);
      }
    };
    */

    const handleCopyPrompt = async () => {
      if (!job.prompt) return;
      try {
        await navigator.clipboard.writeText(job.prompt);
        toast.success(t("item.promptCopied"));
      } catch (error) {
        console.error("Failed to copy prompt:", error);
        toast.error(t("toast.copyError"));
      }
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

    const handleDownloadVideo = async (
      videoUrl: string,
      downloadSuffix: string,
      targetKey: string,
      assetId?: string
    ) => {
      if (!videoUrl) return;

      const fileExt = videoUrl.split('?')[0]?.split('.').pop() || 'mp4';
      const assetType =
        targetKey === 'final_with_bgm'
          ? 'final_with_bgm'
          : targetKey === 'final'
          ? 'final'
          : 'final';

      trackPlausibleEvent('ai_shorts_asset_download_completed', {
        user_id: job.user_id,
        job_id: job.id,
        asset_id: assetId,
        asset_type: assetType,
        file_type: 'video',
        file_ext: fileExt,
        duration_seconds: job.duration_seconds,
        download_source: 'agent_job_item',
        download_method: 'button_click',
        timestamp: new Date().toISOString(),
      });

      const safeSuffix = downloadSuffix ? `_${downloadSuffix}` : '';
      const filename = `agent_video_${job.id}${safeSuffix}.mp4`;
      const proxyUrl = createProxyDownloadUrl(videoUrl, filename);
      const trackedUrl = assetId
        ? buildAgentAssetDownloadUrl(assetId, filename, 'agent_job_item')
        : proxyUrl;

      setDownloadingTarget(targetKey);

      try {
        const response = await fetch(trackedUrl);
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
          triggerDownload(videoUrl, filename);
        }
      } finally {
        setDownloadingTarget(null);
      }
    };

    // Get thumbnail URL (only show user-uploaded reference image)
    const getThumbnailUrl = () => {
      // Only display if user uploaded a reference image
      if (job.reference_image_urls && job.reference_image_urls.length > 0) {
        return job.reference_image_urls[0];
      }
      return null;
    };

    const thumbnailUrl = getThumbnailUrl();
    const badgeLabel = statusInfo.label;
    const badgeClass =
      isCompleted
        ? 'bg-green-500 text-green-900'
        : isVisualFailed
        ? 'bg-red-500 text-red-900'
        : 'bg-blue-500 text-blue-900';

    // Storyboard summary (Phase 3.5+)
    const storyboardJson = job.storyboard_json as any;
    const outline = (storyboardJson?.story_outline || job.story_outline || {}) as any;
    const acts = Array.isArray(outline?.acts) ? outline.acts : [];
    const theme = outline?.theme;
    const tone = outline?.tone;
    const logline = outline?.logline;
    const conflict = outline?.conflict;
    const ending = outline?.ending;
    const summaryText = logline || conflict || ending;
    const storyboardRoot =
      storyboardJson && typeof storyboardJson === 'object'
        ? (storyboardJson as any).storyboard || storyboardJson
        : null;
    const keyElements = Array.isArray(storyboardRoot?.key_elements)
      ? storyboardRoot.key_elements
      : [];
    const characterElements = keyElements.filter(
      (element: any) => element && element.type === 'character'
    );
    const sceneElement =
      keyElements.find((element: any) => element && element.type === 'scene') || null;

    const aspectRatio = job.aspect_ratio || '16:9';
    const videoModelId = job.video_model;
    const modelConfig = videoModelId ? getVideoModel(videoModelId) : undefined;
    const videoModelLabel = (() => {
      if (!videoModelId) return null;
      if (videoModelId === 'auto') return 'Auto';
      if (videoModelId === 'sora-2-image-to-video') return 'Sora 2';
      if (videoModelId === 'kie-veo3-image-to-video') return 'Veo3';
      if (videoModelId === 'byteplus-seedance-1-5-pro-image-to-video') return 'Seedance Pro';
      return modelConfig?.displayName || videoModelId;
    })();

    useEffect(() => {
      let cancelled = false;

      const shouldFetchFinalAssets = ['splicing', 'completed', 'failed'].includes(job.status);
      if (!job.id || !shouldFetchFinalAssets) {
        return () => {
          cancelled = true;
        };
      }

      const fetchFinalAssets = async () => {
        try {
          const [finalRes, finalWithBgmRes] = await Promise.all([
            fetch(`/api/agent/jobs/${job.id}/assets?asset_type=final&limit=1&offset=0`),
            fetch(
              `/api/agent/jobs/${job.id}/assets?asset_type=final_with_bgm&limit=1&offset=0`
            ),
          ]);

          if (!finalRes.ok) {
            throw new Error('Failed to fetch final assets');
          }
          if (!finalWithBgmRes.ok) {
            throw new Error('Failed to fetch final_with_bgm assets');
          }

          const finalPayload = await finalRes.json();
          const finalWithBgmPayload = await finalWithBgmRes.json();

          if (cancelled) return;

          const finalAssets = Array.isArray(finalPayload?.assets)
            ? finalPayload.assets
            : Array.isArray(finalPayload)
            ? finalPayload
            : [];
          const finalWithBgmAssets = Array.isArray(finalWithBgmPayload?.assets)
            ? finalWithBgmPayload.assets
            : Array.isArray(finalWithBgmPayload)
            ? finalWithBgmPayload
            : [];

          setFinalAsset(finalAssets[0] || null);
          setFinalWithBgmAsset(finalWithBgmAssets[0] || null);
        } catch (error) {
          if (cancelled) return;
          console.error('[AgentJobItem] Fetch final assets failed:', error);
          setFinalAsset(null);
          setFinalWithBgmAsset(null);
        }
      };

      fetchFinalAssets();

      return () => {
        cancelled = true;
      };
    }, [job.id, job.status, job.updated_at]);

    const finalHasBgm = finalAsset?.metadata?.has_bgm === true;
    const hasFinalWithBgm = !!finalWithBgmAsset?.url;
    const finalAssetIsNoBgm = !!finalAsset?.url && (hasFinalWithBgm || !finalHasBgm);
    const finalAssetDuration =
      typeof finalAsset?.metadata?.source_duration_seconds === 'number'
        ? finalAsset.metadata.source_duration_seconds
        : typeof finalAsset?.metadata?.duration_seconds === 'number'
        ? finalAsset.metadata.duration_seconds
        : undefined;
    const primaryFinalVideo = (() => {
      if (finalWithBgmAsset?.url) {
        return {
          key: 'final_with_bgm',
          url: finalWithBgmAsset.url,
          label: t("item.finalVideo"),
          downloadSuffix: 'with_bgm',
          assetId: finalWithBgmAsset.id,
        };
      }
      if (finalAsset?.url) {
        return {
          key: 'final',
          url: finalAsset.url,
          label: finalAssetIsNoBgm ? t("item.finalVideoNoBgm") : t("item.finalVideo"),
          downloadSuffix: finalAssetIsNoBgm ? 'no_bgm' : 'with_bgm',
          assetId: finalAsset.id,
        };
      }
      if (job.final_video_url) {
        return {
          key: 'final_fallback',
          url: job.final_video_url,
          label: t("item.finalVideo"),
          downloadSuffix: 'final',
        };
      }
      return null;
    })();
    const extraVideoAssets = finalAssetIsNoBgm && hasFinalWithBgm && finalAsset?.url
      ? [
          {
            id: finalAsset.id || 'final_no_bgm',
            url: finalAsset.url,
            assetId: finalAsset.id,
            title: t("item.finalVideoNoBgm"),
            duration: finalAssetDuration,
          },
        ]
      : undefined;

    return (
      <>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg p-5 space-y-2">
          {/* Header: Status + Thumbnail + Prompt + Timestamp + Actions */}
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Status Badge */}
              <Badge
                className={cn(
                  'text-white text-xs font-semibold px-2.5 py-1 rounded-full border-0 flex-shrink-0 flex items-center gap-1',
                  badgeClass
                )}
              >
                {isProcessing && <Loader2 className="h-3 w-3 animate-spin inline" />}
                {badgeLabel}
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

            {/* Timestamp and Copy Button */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {formatTimestamp() && (
                <span className="text-sm text-gray-400">{formatTimestamp()}</span>
              )}
              <button
                onClick={handleCopyPrompt}
                className="p-0.5 text-gray-400 hover:text-white transition-colors rounded"
                title={t("item.copyPrompt")}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Metadata Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {aspectRatio && (
              <Badge
                variant="secondary"
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-md border-0"
              >
                {aspectRatio}
              </Badge>
            )}
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
              {job.num_shots} {t("item.shots")}
            </Badge>
            {videoModelLabel && (
              <Badge
                variant="secondary"
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-md border-0"
              >
                {videoModelLabel}
              </Badge>
            )}
          </div>

          {/* Story summary */}
          {showAgentInternals && (summaryText || theme || tone || acts.length > 0 || characterElements.length > 0 || sceneElement) && (
            <div className="mt-1 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              {summaryText && (
                <div
                  className="text-gray-500 dark:text-gray-400"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {t("item.story")}: {summaryText}
                </div>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {theme && <span>{t("item.theme")}: {theme}</span>}
                {tone && <span>{t("item.tone")}: {tone}</span>}
                {acts.length > 0 && <span>{t("item.acts")}: {acts.length}</span>}
                {characterElements.length > 0 && <span>{t("item.characters")}: {characterElements.length}</span>}
                {sceneElement && <span>{t("item.scene")}: 1</span>}
              </div>
            </div>
          )}

          {/* Action Bar for Failed/Paused Jobs */}
          {isVisualFailed && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-100/5 dark:bg-gray-800/30 rounded-lg border border-gray-200/20 dark:border-gray-700/30">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                 <span className="flex h-2 w-2 rounded-full bg-red-500/80" />
                 <span>{job.error_message || 'Generation interrupted.'}</span>
              </div>

                              {!isReadOnly && job.can_resume && (
                                  <div className="flex-shrink-0 w-full sm:w-auto">
                                      {(() => {
                                          // If credits haven't loaded yet, show a neutral loading state
                                          if (!hasInitialized) {
                                              return (
                                                  <Button
                                                      size="sm"
                                                      variant="outline"
                                                      className="w-full sm:w-auto h-9 px-5 opacity-70"
                                                      disabled
                                                  >
                                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                      Checking credits...
                                                  </Button>
                                              );
                                          }
              
                                          const estimatedCost = job.estimated_remaining_credits || 0;
                                          const hasEnoughCredits = (leftCredits ?? 0) >= estimatedCost;
              
                                          if (hasEnoughCredits) {
                                              return (
                                                  <Button
                                                      size="sm"
                                                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-9 px-5 shadow-sm"
                                                      onClick={handleResume}
                                                      disabled={isResuming}
                                                  >
                                                                                            {isResuming ? (
                                                                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                                            ) : (
                                                                                                <Play className="h-4 w-4 mr-2 fill-current" />
                                                                                            )}
                                                                                            Continue
                                                                                            <span className="ml-2 text-xs opacity-80 font-normal">
                                                                                               ({estimatedCost} credits)
                                                                                            </span>
                                                                                        </Button>
                                                                                    );
                                                                                } else {
                                                                                     return (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="secondary"
                                                                                            className="w-full sm:w-auto bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 h-9 px-5"
                                                                                            onClick={handleRecharge}
                                                                                        >
                                                                                            <Zap className="h-4 w-4 mr-2" />
                                                                                            Recharge
                                                                                            <span className="ml-2 text-xs opacity-80">
                                                                                               (Need {estimatedCost} credits)
                                                                                            </span>
                                                                                        </Button>
                                                                                    );                                          }
                                      })()}
                                  </div>
                              )}            </div>
          )}

          {/* Assets Grid */}
          {job.shots && job.shots.length > 0 && (
            <AgentAssetGrid
              jobId={job.id}
              userId={job.user_id}
              jobPrompt={job.prompt}
              shots={job.shots}
              finalVideoUrl={job.final_video_url}
              storyboardJson={
                job.storyboard_json ||
                (job.story_outline ? { story_outline: job.story_outline } : null)
              }
              characterReferenceImages={job.character_reference_images || null}
              locale={locale}
              aspectRatio={aspectRatio}
              keyframesEnabled={job.keyframes_enabled}
              progress={job.progress}
              referenceImageUrls={job.reference_image_urls || undefined}
              jobStatus={job.status}
              failedAtStep={job.failed_at_step}
              createdAt={job.created_at}
              videoModelId={videoModelId}
              jobUpdatedAt={job.updated_at}
              extraVideoAssets={extraVideoAssets}
              isResuming={hasResumed}
            />
          )}

          {/* Final Video - Using VideoPlayer component */}
          {primaryFinalVideo ? (
            <div className="space-y-3">
              <div className="grid gap-3">
                <div className="relative w-full">
                  <VideoPlayer
                    videoUrl={primaryFinalVideo.url}
                    posterUrl={job.reference_image_urls?.[0]}
                    onDownload={() =>
                      handleDownloadVideo(
                        primaryFinalVideo.url,
                        primaryFinalVideo.downloadSuffix,
                        primaryFinalVideo.key,
                        primaryFinalVideo.assetId
                      )
                    }
                    canDownload={true}
                    isDownloading={downloadingTarget === primaryFinalVideo.key}
                  />
                  <div className="absolute top-3 left-3 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-md pointer-events-none z-10">
                    {primaryFinalVideo.label}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isReadOnly && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-gray-700/60 hover:bg-gray-600/80 text-white border-gray-600/50 hover:border-gray-500 px-3"
                    onClick={() => onReEdit?.(job)}
                    disabled={isDeleting}
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    <span className="text-xs sm:text-sm">{t("item.reEdit")}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-gray-700/60 hover:bg-gray-600/80 text-white border-gray-600/50 hover:border-gray-500 px-3"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    <span className="text-xs sm:text-sm">{isDeleting ? t("item.deleting") : t("item.delete")}</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Only show Final Video loading state during 'splicing' phase
            // Previous logic included 'generating_videos' and 'orchestrating_videos' which caused duplicate loading indicators
            ['splicing'].includes(job.status) && (
              <div className="relative w-full max-w-[518px] overflow-hidden rounded-lg bg-gray-900 border border-gray-800">
                <div className="aspect-video w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map(index => (
                      <span
                        key={index}
                        className="block w-3 h-3 rounded-full bg-white/70 animate-[agent-loader-bounce_1.2s_ease-in-out_infinite]"
                        style={{ animationDelay: `${index * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          )}

          {/* Agent Logs – inline on job list for better visibility */}
          {showAgentInternals && job.logs && job.logs.length > 0 && (
            <div className="mt-2 bg-gray-950/40 rounded-lg border border-gray-800/60">
              <button
                type="button"
                onClick={() => setShowLogs((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-gray-900/60 transition-colors"
              >
                <span>{t("item.logs")}</span>
                <span className="text-gray-500">
                  {showLogs ? t("item.hide") : t("item.show")}
                </span>
              </button>
              {showLogs && (
                <div className="px-3 pb-2 max-h-80 overflow-y-auto text-sm text-gray-300 space-y-1">
                  <div className="text-xs text-gray-500 font-mono break-all">
                    Agent ID: {job.id}
                  </div>
                  {job.logs.map((log) => (
                    <div key={log.timestamp} className="flex gap-2">
                      <span className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="whitespace-pre-wrap break-words">{log.message}</span>
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
          title={t("item.deleteTitle")}
          description={t("item.deleteConfirm", { prompt: job.prompt.substring(0, 50) })}
        />
      </>
    );
  }
);

AgentJobItem.displayName = 'AgentJobItem';
