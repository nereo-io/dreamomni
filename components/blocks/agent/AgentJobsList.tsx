/**
 * AgentJobsList
 * Right panel displaying user's Agent jobs and Showcase
 * References: video-history/index.tsx for structure and polling logic
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentJob, AgentJobStatusMap } from '@/types/agent';
import { AgentJobItem } from './AgentJobItem';
import { AgentJobSkeleton } from './AgentJobSkeleton';
import { AlertTriangle, Sparkles, History, PlayCircle, Download, Loader2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MediaDetailModal } from '../my-creations-page/MediaDetailModal';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAutoLoadMedia } from '@/hooks/useAutoLoadMedia';
import { useInViewport } from '@/hooks/useInViewport';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { buildAgentAssetDownloadUrl } from '@/utils/agent-download';
import { trackPlausibleEvent } from '@/utils/plausible';

const POLLING_INTERVAL = 5000; // 5 seconds
const JOB_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const RESUMED_JOB_GRACE_PERIOD_MS = 60 * 1000; // 60 seconds grace period for resumed jobs

interface AgentJobsListProps {
  refreshTrigger?: number;
  locale: string;
  onReEdit?: (job: AgentJob) => void;
  onJobResumed?: () => void;
}

export function AgentJobsList({ refreshTrigger, locale, onReEdit, onJobResumed: onJobResumedProp }: AgentJobsListProps) {
  const t = useTranslations("agentJobs");
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  
  // Tabs: 'history' | 'discover'
  const [activeTab, setActiveTab] = useState<'history' | 'discover'>('history');
  const [showcaseJobs, setShowcaseJobs] = useState<AgentJob[]>([]);
  const [isShowcaseLoading, setIsShowcaseLoading] = useState(false);
  const [hasFetchedShowcase, setHasFetchedShowcase] = useState(false);

  // Modal State
  const [selectedJob, setSelectedJob] = useState<AgentJob | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isMobile = useIsMobile();

  // Use ref to track latest jobs without causing re-renders
  const jobsRef = useRef<AgentJob[]>([]);

  // Track recently resumed job IDs with their resume timestamp
  // This ensures polling continues even if server hasn't updated the job status yet
  const resumedJobsRef = useRef<Map<string, number>>(new Map());

  // Force polling until this timestamp (used after resume to ensure continuous polling)
  const forcePollingUntilRef = useRef<number>(0);

  // Track previous refreshTrigger to detect actual changes
  const prevRefreshTriggerRef = useRef(refreshTrigger);

  // Update ref whenever jobs change
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const mergeJobs = useCallback((nextJobs: AgentJob[]) => {
    const prevJobs = jobsRef.current;
    const prevMap = new Map<string, { job: AgentJob; signature: string }>();
    for (const job of prevJobs) {
      prevMap.set(job.id, { job, signature: JSON.stringify(job) });
    }

    let changed = prevJobs.length !== nextJobs.length;

    const merged = nextJobs.map((job, index) => {
      if (!changed && prevJobs[index]?.id !== job.id) {
        changed = true;
      }

      const signature = JSON.stringify(job);
      const prevEntry = prevMap.get(job.id);
      if (prevEntry && prevEntry.signature === signature) {
        return prevEntry.job;
      }
      changed = true;
      return job;
    });

    return changed ? merged : null;
  }, []);

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/agent/jobs?page=1&page_size=5&include_shots=true');

      if (!response.ok) {
        if (response.status === 401) {
          setIsUnauthorized(true);
          setIsLoading(false);
          // 如果未登录，默认切换到 Discover
          setActiveTab('discover');
          return;
        }
        throw new Error('Failed to fetch Agent jobs');
      }

      const data = await response.json();
      const nextJobs = Array.isArray(data.jobs) ? data.jobs : [];
      const merged = mergeJobs(nextJobs);
      if (merged) {
        setJobs(merged);
      }
      setIsLoading(false);
      
      // 如果没有 Job，默认切换到 Discover
      if (nextJobs.length === 0) {
        setActiveTab('discover');
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error(error.message || 'Failed to load Agent jobs');
      setIsLoading(false);
    }
  }, []);

  // Fetch Showcase Jobs
  const fetchShowcaseJobs = useCallback(async () => {
    if (hasFetchedShowcase) return;
    
    setIsShowcaseLoading(true);
    try {
      const response = await fetch('/api/agent/showcase');
      if (response.ok) {
        const data = await response.json();
        setShowcaseJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch showcase jobs:', error);
    } finally {
      setIsShowcaseLoading(false);
      setHasFetchedShowcase(true);
    }
  }, [hasFetchedShowcase]);

  // Fetch showcase when tab becomes active
  useEffect(() => {
    if (activeTab === 'discover') {
      fetchShowcaseJobs();
    }
  }, [activeTab, fetchShowcaseJobs]);

  // Background polling for active jobs
  const updateActiveJobsInBackground = useCallback(async () => {
    // Only poll when History tab is active
    if (activeTab !== 'history' || isUnauthorized) return;

    const now = Date.now();
    const terminalStatuses: AgentJob['status'][] = ['completed', 'failed'];

    // Check if we're in force polling mode (after a resume)
    const isForcePolling = now < forcePollingUntilRef.current;

    // Clean up expired entries from resumedJobsRef
    for (const [jobId, resumedAt] of resumedJobsRef.current.entries()) {
      if (now - resumedAt > RESUMED_JOB_GRACE_PERIOD_MS) {
        resumedJobsRef.current.delete(jobId);
      }
    }

    // Filter active jobs, skip those older than 30 minutes
    const activeJobs = jobsRef.current.filter(job => {
      // Check if this job was recently resumed (within grace period)
      const resumedAt = resumedJobsRef.current.get(job.id);
      const isRecentlyResumed = resumedAt && (now - resumedAt < RESUMED_JOB_GRACE_PERIOD_MS);

      // If recently resumed and still in failed status, treat as active (server may not have updated yet)
      if (isRecentlyResumed) {
        return true;
      }

      if (terminalStatuses.includes(job.status)) {
        return false;
      }

      // Skip polling for jobs older than 30 minutes
      const createdAt = new Date(job.created_at).getTime();
      if (now - createdAt > JOB_TIMEOUT_MS) {
        return false;
      }

      return true;
    });

    // Only skip polling if no active jobs AND not in force polling mode
    if (activeJobs.length === 0 && !isForcePolling) {
      return;
    }

    console.log(`Polling ${activeJobs.length} active jobs (${resumedJobsRef.current.size} recently resumed, force=${isForcePolling})...`);

    try {
      const response = await fetch('/api/agent/jobs?page=1&page_size=5&include_shots=true');

      if (response.ok) {
        const data = await response.json();
        const nextJobs = Array.isArray(data.jobs) ? data.jobs : [];
        const merged = mergeJobs(nextJobs);
        if (merged) {
          setJobs(merged);
        }

        // Clear resumed tracking for jobs that are no longer in failed status
        for (const job of nextJobs) {
          if (resumedJobsRef.current.has(job.id) && job.status !== 'failed') {
            resumedJobsRef.current.delete(job.id);
            // Also clear force polling if all resumed jobs are updated
            if (resumedJobsRef.current.size === 0) {
              forcePollingUntilRef.current = 0;
            }
            console.log(`Job ${job.id} status updated to ${job.status}, removed from resumed tracking`);
          }
        }

        console.log('Job statuses refreshed');
      }
    } catch (error) {
      console.error('Failed to poll job statuses:', error);
    }
  }, [activeTab, isUnauthorized]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Refresh when trigger changes (from parent component)
  useEffect(() => {
    // Only trigger when refreshTrigger actually changes (not on initial mount or activeTab change)
    if (refreshTrigger !== prevRefreshTriggerRef.current && refreshTrigger && refreshTrigger > 0) {
      prevRefreshTriggerRef.current = refreshTrigger;
      fetchJobs();
      // Switch to history to show the new job
      setActiveTab('history');
    }
  }, [refreshTrigger, fetchJobs]);

  // Set up polling for active jobs (wait for previous request to complete)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const poll = async () => {
      await updateActiveJobsInBackground();
      if (isMounted) {
        timeoutId = setTimeout(poll, POLLING_INTERVAL);
      }
    };

    // Start first poll after interval
    timeoutId = setTimeout(poll, POLLING_INTERVAL);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [updateActiveJobsInBackground]);

  // Handle delete job
  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/agent/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Remove from local state
      setJobs(prevJobs => prevJobs.filter(j => j.id !== jobId));
      toast.success('Agent job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  const handleDownload = async (
    job: AgentJob,
    source: string,
    useTracking: boolean
  ) => {
    if (!job.final_video_url) return;

    setDownloadingId(job.id);
    const filename = `agent_video_${job.id}.mp4`;
    const proxyUrl = `/api/proxy-video?url=${encodeURIComponent(job.final_video_url)}&filename=${encodeURIComponent(filename)}`;
    let downloadUrl = proxyUrl;
    let assetType = "final";
    let assetId: string | undefined;

    if (useTracking) {
      try {
        const [finalWithBgmRes, finalRes] = await Promise.all([
          fetch(`/api/agent/jobs/${job.id}/assets?asset_type=final_with_bgm&limit=1&offset=0`),
          fetch(`/api/agent/jobs/${job.id}/assets?asset_type=final&limit=1&offset=0`),
        ]);

        const finalWithBgmPayload = finalWithBgmRes.ok ? await finalWithBgmRes.json() : null;
        const finalPayload = finalRes.ok ? await finalRes.json() : null;

        const finalWithBgmAssets = Array.isArray(finalWithBgmPayload?.assets)
          ? finalWithBgmPayload.assets
          : Array.isArray(finalWithBgmPayload)
          ? finalWithBgmPayload
          : [];
        const finalAssets = Array.isArray(finalPayload?.assets)
          ? finalPayload.assets
          : Array.isArray(finalPayload)
          ? finalPayload
          : [];

        if (finalWithBgmAssets[0]?.id) {
          assetId = finalWithBgmAssets[0].id;
          assetType = "final_with_bgm";
        } else if (finalAssets[0]?.id) {
          assetId = finalAssets[0].id;
          assetType = "final";
        }
        if (assetId) {
          downloadUrl = buildAgentAssetDownloadUrl(assetId, filename, source);
        }
      } catch (error) {
        console.error('[AgentJobsList] Resolve asset download failed:', error);
        downloadUrl = proxyUrl;
      }
    }

    if (useTracking) {
      trackPlausibleEvent('ai_shorts_asset_download_completed', {
        user_id: job.user_id,
        job_id: job.id,
        asset_id: assetId,
        asset_type: assetType,
        file_type: 'video',
        file_ext: job.final_video_url.split('?')[0]?.split('.').pop() || 'mp4',
        duration_seconds: job.duration_seconds,
        download_source: source,
        download_method: 'button_click',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download video');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleJobResumed = useCallback((jobId: string) => {
    // Track this job as recently resumed - this ensures polling continues
    // even if the server hasn't updated the job status yet
    resumedJobsRef.current.set(jobId, Date.now());

    // Set force polling to ensure continuous polling for the grace period
    forcePollingUntilRef.current = Date.now() + RESUMED_JOB_GRACE_PERIOD_MS;
    console.log(`Job ${jobId} marked as resumed, will force poll for ${RESUMED_JOB_GRACE_PERIOD_MS / 1000}s`);

    // Notify parent to trigger refreshTrigger, which will call fetchJobs
    // Don't call fetchJobs here to avoid duplicate calls
    onJobResumedProp?.();
  }, [onJobResumedProp]);

  // Render Logic
  const renderContent = () => {
    // History Tab Logic
    if (activeTab === 'history') {
      if (isUnauthorized) {
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-yellow-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-200 mb-2">
                {t("auth.required")}
              </h3>
              <p className="text-gray-400 mb-4">
                {t("auth.description")}
              </p>
              <button 
                onClick={() => setActiveTab('discover')}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {t("auth.viewShowcase")}
              </button>
            </div>
          </div>
        );
      }

      if (isLoading && jobs.length === 0) {
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <AgentJobSkeleton variant="card" count={3} />
            </div>
          </div>
        );
      }

      if (jobs.length === 0) {
        // Normally shouldn't be reached if we auto-switch, but just in case or if user manually clicks History
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center py-12">
              <History className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-200 mb-2">
                {t("empty.noJobsTitle")}
              </h3>
              <p className="text-gray-400 mb-4">
                {t("empty.noJobsDescription")}
              </p>
              <button 
                onClick={() => setActiveTab('discover')}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {t("empty.checkExamples")}
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 lg:dark-scrollbar">
          <div className="space-y-4">
            {jobs.map(job => (
              <AgentJobItem
                key={job.id}
                job={job}
                onDelete={handleDeleteJob}
                onReEdit={onReEdit}
                onJobResumed={handleJobResumed}
                locale={locale}
              />
            ))}
          </div>
        </div>
      );
    }

    // Discover Tab Logic
    if (activeTab === 'discover') {
      if (isShowcaseLoading && showcaseJobs.length === 0) {
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <AgentJobSkeleton variant="card" count={3} />
            </div>
          </div>
        );
      }

      if (showcaseJobs.length === 0) {
         return (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-gray-400">{t("empty.noShowcase")}</p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 lg:dark-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showcaseJobs.map(job => (
              <JobMediaCard
                key={job.id}
                job={job}
                onOpen={(j) => {
                  setSelectedJob(j);
                  setIsDetailOpen(true);
                }}
                onDownload={(job) => handleDownload(job, 'agent_showcase_card', false)}
                downloadingId={downloadingId}
              />
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex-1 bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col lg:h-full">
      {/* Header with Tabs - Matched with Image Generation UI style */}
      <div className="bg-gray-900 border-b border-gray-800/30 rounded-t-xl">
        <div className="px-6 pt-4">
          <div className="flex items-center gap-8">
            {/* Discover Tab */}
            <button
              onClick={() => setActiveTab('discover')}
              type="button"
              className={cn(
                "relative flex items-center gap-2.5 pb-3 text-lg font-semibold transition-all duration-300 ease-out",
                activeTab === 'discover'
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Sparkles
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  activeTab === 'discover' ? "text-white" : "text-current opacity-60"
                )}
              />
              <span className="tracking-wide">{t("tabs.discover")}</span>
              {activeTab === 'discover' && (
                <div
                  className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-white rounded-full"
                  style={{
                    animation: "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              )}
            </button>

            {/* History Tab */}
            <button
              onClick={() => setActiveTab('history')}
              type="button"
              className={cn(
                "relative flex items-center gap-2.5 pb-3 text-lg font-semibold transition-all duration-300 ease-out",
                activeTab === 'history'
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <History
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  activeTab === 'history' ? "text-white" : "text-current opacity-60"
                )}
              />
              <span className="tracking-wide">
                {t("tabs.history")} {jobs.length > 0 && `(${jobs.length})`}
              </span>
              {activeTab === 'history' && (
                <div
                  className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-white rounded-full"
                  style={{
                    animation: "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      <MediaDetailModal
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedJob(null);
        }}
        videoUrl={selectedJob?.final_video_url}
        posterUrl={selectedJob?.reference_image_urls?.[0]}
        prompt={selectedJob?.prompt || ""}
        inputImages={selectedJob?.reference_image_urls || []}
        details={
          selectedJob
            ? [
                { label: t("modal.labels.videoModel"), value: selectedJob.video_model },
                { label: t("modal.labels.imageModel"), value: selectedJob.image_model },
                { label: t("modal.labels.aspectRatio"), value: selectedJob.aspect_ratio || "-" },
                { label: t("modal.labels.duration"), value: `${selectedJob.duration_seconds}s` },
                { label: t("modal.labels.shots"), value: selectedJob.num_shots },
                {
                  label: t("modal.labels.created"),
                  value: formatDistanceToNow(new Date(selectedJob.created_at), {
                    addSuffix: true,
                  }),
                },
              ]
            : []
        }
        title={t("modal.title")}
        onDownload={() =>
          selectedJob &&
          handleDownload(
            selectedJob,
            activeTab === 'history' ? 'agent_jobs_modal' : 'agent_showcase_modal',
            activeTab === 'history' && !isUnauthorized
          )
        }
        onDelete={() => {}} // No delete for showcase
        onOpenOriginal={() => selectedJob?.final_video_url && window.open(selectedJob.final_video_url, "_blank")}
        isDownloading={selectedJob ? downloadingId === selectedJob.id : false}
      />
    </div>
  );
}

// Simple media card for Discover tab
function JobMediaCard({
  job,
  onOpen,
  onDownload,
  downloadingId,
}: {
  job: AgentJob;
  onOpen: (job: AgentJob) => void;
  onDownload: (job: AgentJob) => void;
  downloadingId: string | null;
}) {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasEverLoaded, setHasEverLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldAutoLoad = useAutoLoadMedia();
  const isInViewport = useInViewport(cardRef, { rootMargin: '200px 0px', threshold: 0.1 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const shouldPlayOnLoadRef = useRef(false);

  const posterUrl = job.reference_image_urls?.[0]; // Revert to only using reference images for poster
  const shouldLoadTrigger =
    Boolean(job.final_video_url) && ((shouldAutoLoad && isInViewport) || hasInteracted);
  const shouldLoadVideo = shouldLoadTrigger || hasEverLoaded;

  useEffect(() => {
    if (shouldLoadTrigger) {
      setHasEverLoaded(true);
    }
  }, [shouldLoadTrigger]);

  const handleMouseEnter = async () => {
    if (isMobile) return;
    setIsHovered(true);
    if (!shouldLoadVideo) {
      shouldPlayOnLoadRef.current = true;
      setHasInteracted(true);
      return;
    }
    if (!job.final_video_url || !videoRef.current) return;

    const element = videoRef.current;
    
    // If video hasn't been loaded yet, setting src and calling play will start it
    if (element.readyState < 2) {
      element.load();
    }

    element.currentTime = 0;
    element.muted = false; // Match /history logic: unmute on hover
    try {
      await element.play();
      setIsMuted(false);
      setAutoplayBlocked(false);
    } catch (error) {
      // Autoplay with sound might be blocked
      element.muted = true;
      setIsMuted(true);
      setAutoplayBlocked(true);
      try {
        await element.play();
      } catch (playError) {
        console.warn("Video autoplay failed:", playError);
      }
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    if (!videoRef.current) return;

    const element = videoRef.current;
    element.pause();
    element.currentTime = 0;
    element.muted = true;
    setIsMuted(true);
    setAutoplayBlocked(false);
  };

  const handleToggleMute = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!videoRef.current) return;
    const element = videoRef.current;
    element.muted = !element.muted;
    setIsMuted(element.muted);
    if (!element.muted) setAutoplayBlocked(false);
  };

  const showOverlay = isMobile || isHovered;

  return (
    <div
      ref={cardRef}
      className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 shadow-sm transition-transform duration-200 hover:-translate-y-1 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={() => setHasInteracted(true)}
      onClick={() => onOpen(job)}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-800">
        {/* Poster Image - Always shown when video is not playing */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt={job.prompt}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-all duration-500",
              isHovered && isVideoLoaded ? "opacity-0 scale-110" : "opacity-100 scale-100"
            )}
            loading="lazy"
          />
        )}

        {job.final_video_url ? (
          <video
            ref={videoRef}
            src={shouldLoadVideo ? `${job.final_video_url}#t=0.1` : undefined}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              "opacity-100"
            )}
            preload={shouldLoadVideo ? "metadata" : "none"}
            playsInline
            muted={isMuted}
            loop
            onLoadedData={() => {
              setIsVideoLoaded(true);
              setHasEverLoaded(true);
              if (shouldPlayOnLoadRef.current && videoRef.current) {
                const playPromise = videoRef.current.play();
                if (playPromise?.catch) {
                  playPromise.catch(() => {});
                }
                shouldPlayOnLoadRef.current = false;
              }
            }}
            controls={isHovered}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            <PlayCircle className="h-12 w-12" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {showOverlay && (
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                onDownload(job);
              }}
              disabled={!job.final_video_url || downloadingId === job.id}
              className={cn(
                "h-9 w-9 bg-black/60 text-white hover:bg-black/80 transition-opacity",
                isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              {downloadingId === job.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Mute toggle if autoplay was blocked */}
        {autoplayBlocked && isHovered && (
          <button
            type="button"
            onClick={handleToggleMute}
            className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 z-20"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
