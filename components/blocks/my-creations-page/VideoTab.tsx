"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Copy,
  Download,
  Loader2,
  PlayCircle,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { VideoGeneration } from "@/types/video";
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
import { getVideoModel } from "@/config/video-models";
import { useAppContext } from "@/contexts/app";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildPaginationItems } from "@/utils/pagination";
import VideoHistorySkeleton from "./VideoHistorySkeleton";
import DeleteConfirmDialog from "@/components/blocks/image-history-for-generation/components/DeleteConfirmDialog";
import { MediaDetailModal } from "./MediaDetailModal";
import PromptSearchBar from './PromptSearchBar';

const ITEMS_PER_PAGE = 50;
const MAX_VISIBLE_PAGES = 10;
const getCacheKey = (page: number, query: string) => `${page}|${query}`;

const getVideoSource = (video: VideoGeneration) =>
  video.video_url_r2 ||
  video.upsample_video_url_veo3 ||
  video.video_url_veo3 ||
  video.video_url_volcano ||
  video.video_url_fal ||
  video.video_url_ali ||
  video.video_url_pixverse ||
  video.video_url_sora ||
  null;

const getVideoPoster = (video: VideoGeneration) =>
  video.image_urls?.[0] || video.input_image_url || "";

export default function VideoTab() {
  const t = useTranslations("video-history");
  const { user, setShowSignModal } = useAppContext();
  const [videos, setVideos] = useState<VideoGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoGeneration | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoGeneration | null>(null);
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
        videos: VideoGeneration[];
        page: number;
        totalPages: number;
        totalItems: number;
      }
    >
  >(new Map());

  const buildHistoryUrl = useCallback((page: number, query: string) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(ITEMS_PER_PAGE),
    });
    if (query) {
      params.set('search', query);
    }
    return `/api/video-generations/history?${params.toString()}`;
  }, []);

  const applyPageData = useCallback((data: {
    videos: VideoGeneration[];
    page: number;
    totalPages: number;
    totalItems: number;
  }) => {
    setVideos(data.videos);
    setCurrentPage(data.page);
    setTotalPages(data.totalPages);
    setTotalItems(data.totalItems);
  }, []);

  const updateActiveTasksInBackground = useCallback(
    async (videos: VideoGeneration[], page: number, query: string) => {
      const activeStatuses = [
        "PENDING",
        "PROMPT_OPTIMIZING",
        "IN_QUEUE",
        "IN_PROGRESS",
        "submitted",
      ];
      const supportedModels = [
        "veo3-apicore-text-to-video",
        "doubao-seedance-1-0-pro-text-to-video",
        "doubao-seedance-1-0-pro-image-to-video",
        "kie-veo3-text-to-video",
      ];

      const allActiveTasks = videos.filter(
        (video: VideoGeneration) =>
          supportedModels.includes(video.model_id) &&
          activeStatuses.includes(video.status)
      );

      if (allActiveTasks.length === 0) {
        return;
      }

      try {
        const statusPromises = allActiveTasks.map(async (video: VideoGeneration) => {
          try {
            await fetch("/api/video-generation/status", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ id: video.id }),
            });
          } catch (error) {
            console.error(`更新任务 ${video.id} 状态失败:`, error);
          }
        });

        await Promise.all(statusPromises);

        const refreshResponse = await fetch(buildHistoryUrl(page, query));
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          if (refreshResult.code === 0 && refreshResult.data) {
            const updatedVideos = refreshResult.data.data || [];
            const pageInfo = refreshResult.data.pagination || {};
            const pageValue = pageInfo.page || page;
            const totalPagesValue = pageInfo.totalPages || 1;
            const totalValue = pageInfo.total || updatedVideos.length;
            const cacheEntry = {
              videos: updatedVideos,
              page: pageValue,
              totalPages: totalPagesValue,
              totalItems: totalValue,
            };

            pageCacheRef.current.set(getCacheKey(pageValue, query), cacheEntry);
            if (query === normalizedQuery && pageValue === currentPage) {
              applyPageData(cacheEntry);
            }
          }
        }
      } catch (error) {
        console.error("后台状态更新失败:", error);
      }
    },
    [applyPageData, buildHistoryUrl, currentPage, normalizedQuery]
  );

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
        const response = await fetch(buildHistoryUrl(page, query));
        if (!response.ok) {
          return;
        }
        const result = await response.json();
        if (result.code === 0 && result.data) {
          const fetchedVideos = result.data.data || [];
          const pageInfo = result.data.pagination || {};
          const pageValue = pageInfo.page || page;
          const totalPagesValue = pageInfo.totalPages || maxPage || 1;
          const totalValue = pageInfo.total || fetchedVideos.length;
          pageCacheRef.current.set(getCacheKey(pageValue, query), {
            videos: fetchedVideos,
            page: pageValue,
            totalPages: totalPagesValue,
            totalItems: totalValue,
          });
        }
      } catch (error) {
        console.warn("Prefetch history failed:", error);
      }
    },
    [buildHistoryUrl, user?.uuid]
  );

  const fetchHistory = useCallback(
    async (page: number, showLoading = true, query: string) => {
      if (!user?.uuid) {
        setVideos([]);
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
        updateActiveTasksInBackground(cached.videos, cached.page, query);
        prefetchPage(page - 1, cached.totalPages, query);
        prefetchPage(page + 1, cached.totalPages, query);
        setIsLoading(false);
        setIsPageLoading(false);
        return;
      }

      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsPageLoading(true);
      }

      try {
        const response = await fetch(buildHistoryUrl(page, query));
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || t("toast.fetchError"));
        }
        const result = await response.json();

        if (result.code === 0 && result.data) {
          const fetchedVideos = result.data.data || [];
          const pageInfo = result.data.pagination || {};
          const pageValue = pageInfo.page || page;
          const totalPagesValue = pageInfo.totalPages || 1;
          const totalValue = pageInfo.total || fetchedVideos.length;

          const cacheEntry = {
            videos: fetchedVideos,
            page: pageValue,
            totalPages: totalPagesValue,
            totalItems: totalValue,
          };

          pageCacheRef.current.set(getCacheKey(pageValue, query), cacheEntry);
          applyPageData(cacheEntry);
          updateActiveTasksInBackground(fetchedVideos, pageValue, query);
          prefetchPage(pageValue - 1, totalPagesValue, query);
          prefetchPage(pageValue + 1, totalPagesValue, query);
        } else {
          throw new Error(result.message || t("toast.noDataReturned"));
        }
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
        setIsPageLoading(false);
      }
    },
    [
      applyPageData,
      buildHistoryUrl,
      prefetchPage,
      t,
      updateActiveTasksInBackground,
      user?.uuid,
    ]
  );

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value.trim());
    setSearchVersion((prev) => prev + 1);
  }, []);

  useEffect(() => {
    pageCacheRef.current.clear();
    setCurrentPage(1);
    fetchHistory(1, true, normalizedQuery);
  }, [fetchHistory, normalizedQuery, searchVersion, user?.uuid]);

  useEffect(() => {
    if (!isDetailOpen || !selectedVideo || videos.length === 0 || showDeleteDialog) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
      }

      if (event.defaultPrevented) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      const currentIndex = videos.findIndex((item) => item.id === selectedVideo.id);
      if (currentIndex === -1) {
        return;
      }

      const delta = event.key === "ArrowUp" ? -1 : 1;
      const nextIndex = currentIndex + delta;
      if (nextIndex < 0 || nextIndex >= videos.length) {
        return;
      }

      event.preventDefault();
      setSelectedVideo(videos[nextIndex]);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailOpen, selectedVideo, showDeleteDialog, videos]);

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchHistory(newPage, false, normalizedQuery);
  };

  const handlePlayVideo = (video: VideoGeneration) => {
    const videoUrl = getVideoSource(video);
    if (videoUrl) {
      window.open(videoUrl, "_blank");
    } else {
      toast.info(t("toast.videoNotAvailable"));
    }
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

  const handleDownloadVideo = async (video: VideoGeneration) => {
    const videoUrl = getVideoSource(video);

    if (!videoUrl) {
      toast.error(t("toast.downloadNotAvailable"));
      return;
    }

    const filename = `${video.prompt.substring(0, 20).replace(/\s+/g, "_")}_${video.id}.mp4`;
    const proxyUrl = createProxyDownloadUrl(videoUrl, filename);

    setDownloadingVideoId(video.id);
    const minimumSpinnerDelay = new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      triggerDownload(proxyUrl, filename);
    } catch (error) {
      console.error("Proxy download failed, falling back to original URL:", error);
      triggerDownload(videoUrl, filename, true);
    } finally {
      await minimumSpinnerDelay;
      setDownloadingVideoId((current) => (current === video.id ? null : current));
    }
  };

  const handleDeleteVideo = (video: VideoGeneration) => {
    setVideoToDelete(video);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!videoToDelete) return;

    setDeletingId(videoToDelete.id);

    try {
      const response = await fetch(`/api/video-generations/${videoToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId: videoToDelete.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete video");
      }

      const result = await response.json();

      if (result.code === 0) {
        const nextTotalItems = Math.max(0, totalItems - 1);
        setTotalItems(nextTotalItems);

        pageCacheRef.current.forEach((entry, key) => {
          const nextVideos = entry.videos.filter((item) => item.id !== videoToDelete.id);
          if (nextVideos.length !== entry.videos.length) {
            pageCacheRef.current.set(key, {
              ...entry,
              videos: nextVideos,
              totalItems: nextTotalItems,
            });
          }
        });

        setVideos((prevVideos) => prevVideos.filter((v) => v.id !== videoToDelete.id));
        toast.success("Video deleted successfully");
        setIsDetailOpen(false);

        if (videos.length === 1 && currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
      } else {
        throw new Error(result.message || "Failed to delete video");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setVideoToDelete(null);
    }
  };

  const getStatusBadge = (status: VideoGeneration["status"]) => {
    switch (status) {
      case "COMPLETED":
      case "SAVED_TO_R2":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
            {t("status.completed")}
          </Badge>
        );
      case "IN_PROGRESS":
      case "IN_QUEUE":
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            {t("status.processing")}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="border-gray-600 text-gray-200">
            {t("status.pending")}
          </Badge>
        );
      case "FAILED":
        return <Badge variant="destructive">{t("status.failed")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const matchesLabel = hasSearch ? t('searchMatches', { count: videos.length }) : '';

  if (!user?.uuid) {
    return (
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <div className="bg-gray-900 min-h-[calc(100vh-180px)] rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            <div className="p-4 md:p-6 text-center py-12">
              <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
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

  if (!videos?.length && !hasSearch && !isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <div className="bg-gray-900 min-h-[calc(100vh-180px)] rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            <div className="p-4 md:p-6 text-center py-12">
              <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
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
            {isLoading ? (
              <VideoHistorySkeleton className="p-0 mt-8 md:mt-10" />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-8 md:mt-10">
                  {videos.length === 0 ? (
                    hasSearch ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 p-8 text-center text-sm text-gray-400">
                        {t('searchNoResults')}
                      </div>
                    ) : null
                  ) : (
                    videos.map((video) => (
                      <VideoMediaCard
                        key={video.id}
                        video={video}
                        downloadingId={downloadingVideoId}
                        deletingId={deletingId}
                        onOpen={(item) => {
                          setSelectedVideo(item);
                          setIsDetailOpen(true);
                        }}
                        onDownload={handleDownloadVideo}
                        onDelete={handleDeleteVideo}
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
              </>
            )}
          </div>
        </div>
      </div>

      <MediaDetailModal
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setSelectedVideo(null);
          }
        }}
        videoUrl={selectedVideo ? getVideoSource(selectedVideo) : null}
        posterUrl={selectedVideo ? getVideoPoster(selectedVideo) : null}
        prompt={selectedVideo?.prompt || ""}
        inputImages={
          selectedVideo?.image_urls?.length
            ? selectedVideo.image_urls
            : selectedVideo?.input_image_url
            ? [selectedVideo.input_image_url]
            : []
        }
        details={
          selectedVideo
            ? [
                {
                  label: t("labels.model"),
                  value: getVideoModel(selectedVideo.model_id)?.displayName || selectedVideo.model_id,
                },
                {
                  label: "Status",
                  value: getStatusBadge(selectedVideo.status),
                },
                {
                  label: t("labels.aspectRatio"),
                  value: selectedVideo.aspect_ratio || "-",
                },
                {
                  label: t("labels.duration"),
                  value: selectedVideo.duration_seconds
                    ? `${selectedVideo.duration_seconds}s`
                    : "-",
                },
                {
                  label: "Created",
                  value: formatDistanceToNow(new Date(selectedVideo.created_at), {
                    addSuffix: true,
                  }),
                },
              ]
            : []
        }
        statusBadge={null} // Already included in details, or can be passed here if we want it in header
        hasAudio={selectedVideo?.has_audio ?? undefined}
        errorMessage={selectedVideo?.error_message}
        title={t("videoDetailsTitle")}
        onDownload={() => selectedVideo && handleDownloadVideo(selectedVideo)}
        onDelete={() => selectedVideo && handleDeleteVideo(selectedVideo)}
        onOpenOriginal={() => selectedVideo && handlePlayVideo(selectedVideo)}
        isDownloading={selectedVideo ? downloadingVideoId === selectedVideo.id : false}
        isDeleting={selectedVideo ? deletingId === selectedVideo.id : false}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setVideoToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        prompt={videoToDelete?.prompt || ""}
        isDeleting={!!deletingId}
        description="Are you sure you want to delete this video?"
      />
    </div>
  );
}

interface VideoMediaCardProps {
  video: VideoGeneration;
  onOpen: (video: VideoGeneration) => void;
  onDownload: (video: VideoGeneration) => void;
  onDelete: (video: VideoGeneration) => void;
  downloadingId: string | null;
  deletingId: string | null;
}

function VideoMediaCard({
  video,
  onOpen,
  onDownload,
  onDelete,
  downloadingId,
  deletingId,
}: VideoMediaCardProps) {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoUrl = getVideoSource(video);
  const posterUrl = getVideoPoster(video);

  const handleMouseEnter = async () => {
    if (isMobile) {
      return;
    }
    setIsHovered(true);
    if (!videoUrl || !videoRef.current) {
      return;
    }
    const element = videoRef.current;
    element.currentTime = 0;
    element.muted = false;
    try {
      await element.play();
      setIsMuted(false);
      setAutoplayBlocked(false);
    } catch (error) {
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
    if (isMobile) {
      return;
    }
    setIsHovered(false);
    if (!videoRef.current) {
      return;
    }
    const element = videoRef.current;
    element.pause();
    element.currentTime = 0;
    element.muted = true;
    setIsMuted(true);
    setAutoplayBlocked(false);
  };

  const handleToggleMute = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    if (!videoRef.current) {
      return;
    }
    const element = videoRef.current;
    if (element.muted) {
      element.muted = false;
      setIsMuted(false);
      setAutoplayBlocked(false);
      try {
        await element.play();
      } catch (error) {
        element.muted = true;
        setIsMuted(true);
      }
    } else {
      element.muted = true;
      setIsMuted(true);
    }
  };

  const showOverlay = isMobile || isHovered;
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 shadow-sm transition-transform duration-200 hover:-translate-y-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpen(video)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onOpen(video);
        }
      }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-800">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            preload="metadata"
            playsInline
            controls={isHovered}
          />
        ) : posterUrl ? (
          <img
            src={posterUrl}
            alt={video.prompt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
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
                onDownload(video);
              }}
              disabled={!videoUrl || downloadingId === video.id}
              className="h-9 w-9 bg-black/60 text-white hover:bg-black/80"
            >
              {downloadingId === video.id ? (
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
                onDelete(video);
              }}
              disabled={deletingId === video.id}
              className="h-9 w-9 bg-black/60 text-white hover:bg-red-500/80"
            >
              {deletingId === video.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {video.has_audio && autoplayBlocked && isHovered && (
          <button
            type="button"
            onClick={handleToggleMute}
            className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label={isMuted ? "Unmute preview" : "Mute preview"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

interface VideoDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: VideoGeneration | null;
  onDownload: (video: VideoGeneration) => void;
  onDelete: (video: VideoGeneration) => void;
  onOpenInNewTab: (video: VideoGeneration) => void;
  downloadingId: string | null;
  deletingId: string | null;
  getStatusBadge: (status: VideoGeneration["status"]) => JSX.Element;
  t: (key: string) => string;
}

function VideoDetailModal({
  open,
  onOpenChange,
  video,
  onDownload,
  onDelete,
  onOpenInNewTab,
  downloadingId,
  deletingId,
  getStatusBadge,
  t,
}: VideoDetailModalProps) {
  const isMobile = useIsMobile();
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  useEffect(() => {
    setIsPromptExpanded(false);
  }, [video?.id]);

  if (!video) {
    return null;
  }

  const videoUrl = getVideoSource(video);
  const posterUrl = getVideoPoster(video);
  const inputImages = video.image_urls?.length
    ? video.image_urls
    : video.input_image_url
    ? [video.input_image_url]
    : [];

  const detailBody = (
    <div className="grid h-full grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="relative flex items-center justify-center bg-black/80">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={posterUrl}
            controls
            playsInline
            className="h-full w-full object-contain"
          />
        ) : posterUrl ? (
          <img
            src={posterUrl}
            alt={video.prompt}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <PlayCircle className="h-16 w-16" />
          </div>
        )}
      </div>
      <div className="flex h-full flex-col border-t border-gray-800 md:border-t-0 md:border-l">
        <ScrollArea className="flex-1">
          <div className="space-y-5 p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-100">Video details</div>
              {video.has_audio && (
                <Badge className="bg-blue-500/20 text-blue-200 border border-blue-400/40">
                  Audio
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-gray-400">
                Prompt
              </div>
              <p
                className={`text-sm text-gray-100 ${
                  isPromptExpanded ? "" : "line-clamp-3"
                }`}
              >
                {video.prompt}
              </p>
              {video.prompt && video.prompt.length > 120 && (
                <button
                  type="button"
                  onClick={() => setIsPromptExpanded((prev) => !prev)}
                  className="text-xs font-medium text-blue-300 hover:text-blue-200"
                >
                  {isPromptExpanded ? "Collapse" : "Expand"}
                </button>
              )}
            </div>

            {inputImages.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-gray-400">
                  Input images
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {inputImages.slice(0, 4).map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-800 bg-black/50">
                      <img
                        src={imageUrl}
                        alt={`Input ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <DetailRow
                label={t("labels.model")}
                value={getVideoModel(video.model_id)?.displayName || video.model_id}
              />
              <DetailRow label="Status" value={getStatusBadge(video.status)} />
              <DetailRow
                label={t("labels.aspectRatio")}
                value={video.aspect_ratio || "-"}
              />
              <DetailRow
                label={t("labels.duration")}
                value={
                  video.duration_seconds ? `${video.duration_seconds}s` : "-"
                }
              />
              <DetailRow
                label="Created"
                value={formatDistanceToNow(new Date(video.created_at), {
                  addSuffix: true,
                })}
              />
            </div>

            {video.error_message && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                {video.error_message}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-5 md:p-6 border-t border-gray-800 bg-gray-900/30">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => onOpenInNewTab(video)}
              disabled={!videoUrl}
              className="w-full bg-gray-800/80 text-gray-100 hover:bg-gray-700"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Open
            </Button>
            <Button
              variant="secondary"
              onClick={() => onDownload(video)}
              disabled={!videoUrl || downloadingId === video.id}
              className="w-full bg-gray-800/80 text-gray-100 hover:bg-gray-700"
            >
              {downloadingId === video.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>
            <Button
              variant="secondary"
              onClick={() => onDelete(video)}
              disabled={deletingId === video.id}
              className="w-full bg-red-500/20 text-red-100 hover:bg-red-500/40"
            >
              {deletingId === video.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(video.prompt);
                toast.success("Prompt copied");
              }}
              className="w-full border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex h-[95vh] flex-col bg-gray-950 text-gray-100 border-gray-800">
          <div className="flex items-center justify-between px-4 pt-2">
            <DrawerTitle className="text-sm font-semibold">Video details</DrawerTitle>
            <DrawerClose asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>
          <div className="mt-3 flex-1 overflow-hidden">{detailBody}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[1400px] h-[85vh] p-0 overflow-hidden bg-gray-950 text-gray-100 border-gray-800 flex flex-col">
        {detailBody}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm text-gray-200">
      <span className="text-gray-400">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
