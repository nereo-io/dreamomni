"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  Loader2,
  PlayCircle,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "@/contexts/app";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildPaginationItems } from "@/utils/pagination";
import { AgentJob, AgentJobListResponse, AgentJobStatusMap } from "@/types/agent";
import VideoHistorySkeleton from "./VideoHistorySkeleton";
import DeleteConfirmDialog from "@/components/blocks/image-history-for-generation/components/DeleteConfirmDialog";
import { MediaDetailModal } from "./MediaDetailModal";
import PromptSearchBar from './PromptSearchBar';

const ITEMS_PER_PAGE = 50;
const MAX_VISIBLE_PAGES = 10;
const getCacheKey = (page: number, query: string) => `${page}|${query}`;

const statusToneMap: Record<string, string> = {
  gray: "bg-gray-500/20 text-gray-200 border-gray-400/30",
  indigo: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
  purple: "bg-purple-500/20 text-purple-200 border-purple-400/30",
  blue: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  yellow: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  cyan: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
  violet: "bg-violet-500/20 text-violet-200 border-violet-400/30",
  green: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  red: "bg-red-500/20 text-red-200 border-red-400/30",
};

export default function JobsTab() {
  const t = useTranslations("video-history");
  const { user, setShowSignModal } = useAppContext();
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalItems] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<AgentJob | null>(null);
  const [selectedJob, setSelectedJob] = useState<AgentJob | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVersion, setSearchVersion] = useState(0);
  const normalizedQuery = searchQuery.trim();
  const hasSearch = normalizedQuery.length > 0;
  const pageCacheRef = useRef<
    Map<
      string,
      {
        jobs: AgentJob[];
        page: number;
        totalPages: number;
        totalItems: number;
      }
    >
  >(new Map());

  const jobsWithFinal = useMemo(
    () => jobs.filter((job) => job.final_video_url),
    [jobs]
  );
  const matchesLabel = hasSearch ? t('searchMatches', { count: jobsWithFinal.length }) : '';

  const applyPageData = useCallback((data: {
    jobs: AgentJob[];
    page: number;
    totalPages: number;
    totalItems: number;
  }) => {
    setJobs(data.jobs);
    setCurrentPage(data.page);
    setTotalPages(data.totalPages);
    setTotalItems(data.totalItems);
  }, []);

  const buildJobsUrl = useCallback((page: number, query: string) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(ITEMS_PER_PAGE),
      include_shots: 'true',
    });
    if (query) {
      params.set('search', query);
    }
    return `/api/agent/jobs?${params.toString()}`;
  }, []);

  const prefetchPage = useCallback(
    async (page: number, maxPage: number, query: string) => {
      if (!user?.uuid || page < 1 || page > maxPage) {
        return;
      }
      const cacheKey = getCacheKey(page, query);
      if (pageCacheRef.current.has(cacheKey)) {
        return;
      }

      try {
        const response = await fetch(buildJobsUrl(page, query));

        if (!response.ok) {
          return;
        }

        const data: AgentJobListResponse | {
          jobs: AgentJob[];
          total?: number;
          page?: number;
          page_size?: number;
          total_pages?: number;
        } = await response.json();

        const jobsData = data.jobs || [];
        const total =
          typeof (data as any).total === "number" ? (data as any).total : jobsData.length;
        const pageSize =
          typeof (data as any).page_size === "number"
            ? (data as any).page_size
            : ITEMS_PER_PAGE;
        const totalPagesFromResponse =
          typeof (data as any).total_pages === "number"
            ? (data as any).total_pages
            : Math.max(1, Math.ceil((total || 0) / (pageSize || ITEMS_PER_PAGE)));
        const pageFromResponse =
          typeof (data as any).page === "number" ? (data as any).page : page;

        pageCacheRef.current.set(getCacheKey(pageFromResponse, query), {
          jobs: jobsData,
          page: pageFromResponse,
          totalPages: totalPagesFromResponse,
          totalItems: total,
        });
      } catch (error) {
        console.warn("Prefetch jobs failed:", error);
      }
    },
    [buildJobsUrl, user?.uuid]
  );

  const fetchJobs = useCallback(
    async (page = 1, showLoading = true, query: string) => {
      if (!user?.uuid) {
        setJobs([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(0);
        setIsLoading(false);
        setIsPageLoading(false);
        pageCacheRef.current.clear();
        return;
      }

      const cacheKey = getCacheKey(page, query);
      const cached = pageCacheRef.current.get(cacheKey);
      if (cached) {
        applyPageData(cached);
        setIsLoading(false);
        setIsPageLoading(false);
        prefetchPage(page - 1, cached.totalPages, query);
        prefetchPage(page + 1, cached.totalPages, query);
        return;
      }

      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsPageLoading(true);
      }

      try {
        const response = await fetch(buildJobsUrl(page, query));

        if (!response.ok) {
          throw new Error(t("toast.fetchError"));
        }

        const data: AgentJobListResponse | {
          jobs: AgentJob[];
          total?: number;
          page?: number;
          page_size?: number;
          total_pages?: number;
        } = await response.json();

        const jobsData = data.jobs || [];
        const total =
          typeof (data as any).total === "number" ? (data as any).total : jobsData.length;
        const pageSize =
          typeof (data as any).page_size === "number"
            ? (data as any).page_size
            : ITEMS_PER_PAGE;
        const totalPagesFromResponse =
          typeof (data as any).total_pages === "number"
            ? (data as any).total_pages
            : Math.max(1, Math.ceil((total || 0) / (pageSize || ITEMS_PER_PAGE)));
        const pageFromResponse =
          typeof (data as any).page === "number" ? (data as any).page : page;

        const cacheEntry = {
          jobs: jobsData,
          page: pageFromResponse,
          totalPages: totalPagesFromResponse,
          totalItems: total,
        };

        pageCacheRef.current.set(getCacheKey(pageFromResponse, query), cacheEntry);
        applyPageData(cacheEntry);
        prefetchPage(pageFromResponse - 1, totalPagesFromResponse, query);
        prefetchPage(pageFromResponse + 1, totalPagesFromResponse, query);
      } catch (error: any) {
        console.error("Failed to fetch jobs:", error);
        toast.error(error?.message || t("toast.fetchError"));
      } finally {
        setIsLoading(false);
        setIsPageLoading(false);
      }
    },
    [applyPageData, buildJobsUrl, prefetchPage, t, user?.uuid]
  );

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value.trim());
    setSearchVersion((prev) => prev + 1);
  }, []);

  useEffect(() => {
    pageCacheRef.current.clear();
    setCurrentPage(1);
    fetchJobs(1, true, normalizedQuery);
  }, [fetchJobs, normalizedQuery, searchVersion, user?.uuid]);

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    fetchJobs(page, false, normalizedQuery);
  };

  const createProxyDownloadUrl = (sourceUrl: string, filename: string) =>
    `/api/proxy-video?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(filename)}`;

  const triggerDownload = (
    href: string,
    filename: string,
    openInNewTab = false
  ) => {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    link.rel = "noopener noreferrer";
    link.style.display = "none";
    link.target = openInNewTab ? "_blank" : "_self";

    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      document.body.removeChild(link);
    }
  };

  const handlePlay = (job: AgentJob) => {
    if (!job.final_video_url) {
      toast.info(t("toast.videoNotAvailable"));
      return;
    }
    window.open(job.final_video_url, "_blank");
  };

  const handleDownload = async (job: AgentJob) => {
    if (!job.final_video_url) {
      toast.error(t("toast.downloadNotAvailable"));
      return;
    }

    const filename = `agent_job_${job.id}.mp4`;
    const proxyUrl = createProxyDownloadUrl(job.final_video_url, filename);

    setDownloadingId(job.id);
    const minimumSpinnerDelay = new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      triggerDownload(proxyUrl, filename);
    } catch (err) {
      console.error("Proxy download failed, falling back to original URL:", err);
      triggerDownload(job.final_video_url, filename, true);
    } finally {
      await minimumSpinnerDelay;
      setDownloadingId((current) => (current === job.id ? null : current));
    }
  };

  const handleDeleteJob = (job: AgentJob) => {
    setJobToDelete(job);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) {
      return;
    }

    setDeletingId(jobToDelete.id);

    try {
      const response = await fetch(`/api/agent/jobs/${jobToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      const result = await response.json();
      if (result?.success === false) {
        throw new Error(result.message || "Failed to delete job");
      }

      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobToDelete.id));
      setTotalItems((prev) => Math.max(0, prev - 1));
      pageCacheRef.current.forEach((entry, key) => {
        const nextJobs = entry.jobs.filter((job) => job.id !== jobToDelete.id);
        if (nextJobs.length !== entry.jobs.length) {
          pageCacheRef.current.set(key, {
            ...entry,
            jobs: nextJobs,
            totalItems: Math.max(0, entry.totalItems - 1),
          });
        }
      });

      toast.success("Job deleted successfully");
      setIsDetailOpen(false);
    } catch (error) {
      console.error("Delete job failed:", error);
      toast.error("Failed to delete job");
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setJobToDelete(null);
    }
  };

  const getStatusBadge = (status: AgentJob["status"]) => {
    const meta = AgentJobStatusMap[status];
    const tone = meta ? statusToneMap[meta.color] : statusToneMap.gray;
    return (
      <Badge className={tone}>
        {meta?.label || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <div className="bg-gray-900 min-h-[calc(100vh-180px)] rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            <VideoHistorySkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!user?.uuid) {
    return (
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <div className="bg-gray-900 min-h-[calc(100vh-180px)] rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            <div className="p-4 md:p-6 text-center py-12">
              <div className="mx-auto mb-4 h-16 w-16 text-gray-400">
                <PlayCircle className="h-16 w-16" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-200 mb-2">
                {t("pleaseSignIn")}
              </h3>
              <p className="text-gray-400 mb-6">{t("signInToViewVideos")}</p>
              <Button
                onClick={() => setShowSignModal(true)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t("signInButton")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!jobsWithFinal.length && !hasSearch) {
    return (
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <div className="bg-gray-900 min-h-[calc(100vh-180px)] rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            <div className="p-4 md:p-6 text-center py-12">
              <div className="mx-auto mb-4 h-16 w-16 text-gray-400">
                <PlayCircle className="h-16 w-16" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-200 mb-2">
                {t("noVideosTitle")}
              </h3>
              <p className="text-gray-400 mb-6">{t("noVideosDescription")}</p>
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <a href="/image-to-video">{t("generateVideoButton")}</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paginationItems = buildPaginationItems(
    currentPage,
    totalPages,
    MAX_VISIBLE_PAGES
  );

  return (
    <div className="flex flex-col lg:flex-row gap-2 h-full">
      <div className="bg-gray-900 min-h-[calc(100vh-180px)] rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
        <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar relative">
          {isPageLoading && (
            <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-10">
              <VideoHistorySkeleton />
            </div>
          )}
          <div className="p-4 md:p-6">
            <PromptSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              placeholder={t('searchPromptPlaceholder')}
              buttonLabel={t('searchButton')}
              matchesLabel={matchesLabel}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-8 md:mt-10">
              {jobsWithFinal.length === 0 ? (
                hasSearch ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 p-8 text-center text-sm text-gray-400">
                    {t('searchNoResults')}
                  </div>
                ) : null
              ) : (
                jobsWithFinal.map((job) => (
                  <JobMediaCard
                    key={job.id}
                    job={job}
                    downloadingId={downloadingId}
                    deletingId={deletingId}
                    onOpen={(item) => {
                      setSelectedJob(item);
                      setIsDetailOpen(true);
                    }}
                    onDownload={handleDownload}
                    onDelete={handleDeleteJob}
                  />
                ))
              )}
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                  {paginationItems.map((item, index) =>
                    item === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(item);
                          }}
                          isActive={currentPage === item}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          handlePageChange(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>

      <MediaDetailModal
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setSelectedJob(null);
          }
        }}
        videoUrl={selectedJob?.final_video_url}
        posterUrl={selectedJob?.reference_image_url}
        prompt={selectedJob?.prompt || ""}
        inputImages={
          selectedJob?.reference_image_urls?.length
            ? selectedJob.reference_image_urls
            : selectedJob?.reference_image_url
            ? [selectedJob.reference_image_url]
            : []
        }
        details={
          selectedJob
            ? [
                { label: "Video model", value: selectedJob.video_model },
                { label: "Image model", value: selectedJob.image_model },
                { label: "Status", value: getStatusBadge(selectedJob.status) },
                { label: "Aspect ratio", value: selectedJob.aspect_ratio || "-" },
                { label: "Duration", value: `${selectedJob.duration_seconds}s` },
                { label: "Shots", value: selectedJob.num_shots },
                { label: "Credits", value: selectedJob.credits_charged },
                {
                  label: "Created",
                  value: formatDistanceToNow(new Date(selectedJob.created_at), {
                    addSuffix: true,
                  }),
                },
              ]
            : []
        }
        statusBadge={null}
        errorMessage={selectedJob?.error_message}
        title="Job details"
        onDownload={() => selectedJob && handleDownload(selectedJob)}
        onDelete={() => selectedJob && handleDeleteJob(selectedJob)}
        onOpenOriginal={() => selectedJob && handlePlay(selectedJob)}
        isDownloading={selectedJob ? downloadingId === selectedJob.id : false}
        isDeleting={selectedJob ? deletingId === selectedJob.id : false}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setJobToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        prompt={jobToDelete?.prompt || ""}
        isDeleting={!!deletingId}
        description="Are you sure you want to delete this job?"
        title="Delete job"
      />
    </div>
  );
}

interface JobMediaCardProps {
  job: AgentJob;
  onOpen: (job: AgentJob) => void;
  onDownload: (job: AgentJob) => void;
  onDelete: (job: AgentJob) => void;
  downloadingId: string | null;
  deletingId: string | null;
}

function JobMediaCard({
  job,
  onOpen,
  onDownload,
  onDelete,
  downloadingId,
  deletingId,
}: JobMediaCardProps) {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 shadow-sm transition-transform duration-200 hover:-translate-y-1"
      onMouseEnter={() => {
        if (!isMobile) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (!isMobile) {
          setIsHovered(false);
        }
      }}
      onClick={() => onOpen(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onOpen(job);
        }
      }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-800">
        {job.final_video_url ? (
          <video
            src={job.final_video_url}
            poster={job.reference_image_url || undefined}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            preload="metadata"
            playsInline
            controls={isHovered}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            <PlayCircle className="h-12 w-12" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute right-3 top-3 flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onDownload(job);
            }}
            disabled={!job.final_video_url || downloadingId === job.id}
            className={`h-9 w-9 bg-black/60 text-white hover:bg-black/80 ${
              isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } transition-opacity`}
          >
            {downloadingId === job.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(job);
            }}
            disabled={deletingId === job.id}
            className={`h-9 w-9 bg-black/60 text-white hover:bg-red-500/80 ${
              isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } transition-opacity`}
          >
            {deletingId === job.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
