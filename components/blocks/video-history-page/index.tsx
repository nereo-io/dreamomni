"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { VideoGeneration, VideoGenerationHistoryResponse } from "@/types/video";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  PlayCircle,
  Download,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Volume2,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { getVideoModel } from "@/config/video-models";
import { useAppContext } from "@/contexts/app";
import DeleteConfirmDialog from "@/components/blocks/image-history-for-generation/components/DeleteConfirmDialog";

const ITEMS_PER_PAGE = 12;
const MAX_BACKGROUND_STATUS_UPDATES = 5;

export default function VideoHistoryPageClient() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const t = useTranslations("video-history");
  const { user, setShowSignModal } = useAppContext();
  const [videos, setVideos] = useState<VideoGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoGeneration | null>(null);

  // 后台异步更新进行中的任务状态
  const updateActiveTasksInBackground = useCallback(
    async (videos: VideoGeneration[]) => {
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

      const limitedActiveTasks = allActiveTasks.slice(0, MAX_BACKGROUND_STATUS_UPDATES);

      if (limitedActiveTasks.length === 0) {
        return;
      }

      console.log(`后台更新 ${limitedActiveTasks.length} 个进行中任务的状态...`);

      try {
        // 串行触发状态更新，降低瞬时压力
        for (const video of limitedActiveTasks) {
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
        }
        console.log(`后台状态更新完成`);

        // 静默刷新历史记录以显示最新状态
        const refreshResponse = await fetch(`/api/video-generations/history`);
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          if (refreshResult.code === 0 && refreshResult.data) {
            const updatedVideos = refreshResult.data.data || [];
            setVideos(updatedVideos);
            console.log(`历史记录已静默更新`);
          }
        }
      } catch (error) {
        console.error("后台状态更新失败:", error);
      }
    },
    []
  );

  // 快速加载历史记录（不检查状态）
  const fetchHistory = useCallback(
    async (page: number) => {
      setIsLoading(true);

      // 如果用户未登录，直接设置为空状态，不发送请求
      if (!user?.uuid) {
        setVideos([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(0);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/video-generations/history?page=${page}&limit=${ITEMS_PER_PAGE}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || t("toast.fetchError"));
        }
        const result = await response.json();
        console.log(result);

        if (result.code === 0 && result.data) {
          const videos = result.data.data || [];

          setVideos(videos);
          setCurrentPage(result.data.pagination?.page || 1);
          setTotalPages(result.data.pagination?.totalPages || 1);
          setTotalItems(result.data.pagination?.total || 0);

          // 异步检查并更新进行中的任务状态（不阻塞页面渲染）
          updateActiveTasksInBackground(videos);
        } else {
          throw new Error(result.message || t("toast.noDataReturned"));
        }
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [updateActiveTasksInBackground, t, user?.uuid]
  );

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams?.get("page") || "1");
    fetchHistory(pageFromUrl);
  }, [searchParams, fetchHistory]);

  const handlePageChange = (newPage: number) => {
    // 保持当前路径的国际化参数
    const newUrl = `${pathname}?page=${newPage}`;
    router.push(newUrl);
  };

  const handlePlayVideo = (video: VideoGeneration) => {
    // Check for video URL availability (prioritize R2, then upsample veo3, then regular veo3, then volcano/seedance, then fal)
    const videoUrl =
      video.video_url_r2 ||
      video.upsample_video_url_veo3 ||
      video.video_url_veo3 ||
      video.video_url_volcano ||
      video.video_url_fal;
    if (videoUrl) {
      window.open(videoUrl, "_blank");
    } else {
      toast.info(t("toast.videoNotAvailable"));
    }
  };

  const handleDownloadVideo = (video: VideoGeneration) => {
    const videoUrl =
      video.video_url_r2 ||
      video.upsample_video_url_veo3 ||
      video.video_url_veo3 ||
      video.video_url_volcano ||
      video.video_url_fal;
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `${video.prompt.substring(0, 20).replace(/\s+/g, "_")}_${
        video.id
      }.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error(t("toast.downloadNotAvailable"));
    }
  };

  const handleRegenerateVideo = (video: VideoGeneration) => {
    // This might involve navigating back to the generator with pre-filled params
    // For simplicity, just logging now. Can be expanded later.
    console.log("Regenerate video:", video);
    toast.info(t("toast.regenerationNotImplemented"));
    // router.push(`/generate?prompt=${encodeURIComponent(video.prompt)}&aspect_ratio=${video.aspect_ratio}...`);
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
        // 成功删除，从本地状态移除
        setVideos((prevVideos) =>
          prevVideos.filter((v) => v.id !== videoToDelete.id)
        );
        toast.success("Video deleted successfully");

        // 如果当前页没有视频了，并且不是第一页，跳转到上一页
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
          <Badge
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white border-transparent"
          >
            {t("status.completed")}
          </Badge>
        );
      case "IN_PROGRESS":
      case "IN_QUEUE":
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            {t("status.processing")}
          </Badge>
        );
      case "PENDING":
        return <Badge variant="outline">{t("status.pending")}</Badge>;
      case "FAILED":
        return <Badge variant="destructive">{t("status.failed")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!videos?.length && !isLoading) {
    return (
      <div className="text-center py-12">
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
          <Link href="/image-to-video">{t("generateVideoButton")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">{t("title")}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <Card
            key={video.id}
            className="bg-gray-800 border-gray-700 text-gray-200 flex flex-col"
          >
            <CardHeader>
              <div className="aspect-video bg-gray-700 rounded-md mb-3 flex items-center justify-center overflow-hidden relative">
                {video.video_url_r2 ||
                video.upsample_video_url_veo3 ||
                video.video_url_veo3 ||
                video.video_url_volcano ||
                video.video_url_fal ? (
                  <video
                    src={
                      video.video_url_r2 ??
                      video.upsample_video_url_veo3 ??
                      video.video_url_veo3 ??
                      video.video_url_volcano ??
                      video.video_url_fal ??
                      ""
                    }
                    poster={video.input_image_url ?? ""}
                    className="w-full h-full object-cover"
                    preload="auto"
                    controls={false} // Disable default controls, using custom play button
                  />
                ) : video.input_image_url ? (
                  <img
                    src={video.input_image_url}
                    alt="Input image"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PlayCircle className="h-16 w-16 text-gray-500" />
                )}

                {/* Audio indicator */}
                {video.has_audio && (
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Volume2 className="h-3 w-3" />
                      Audio
                    </Badge>
                  </div>
                )}
              </div>
              <CardTitle className="text-lg truncate" title={video.prompt}>
                {video.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex justify-between items-center mb-2">
                {getStatusBadge(video.status)}
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(video.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <p className="text-sm text-gray-400">
                {t("labels.model")}:{" "}
                {getVideoModel(video.model_id)?.displayName || video.model_id}
              </p>
              <p className="text-sm text-gray-400">
                {t("labels.duration")}: {video.duration_seconds}s
              </p>
              <p className="text-sm text-gray-400">
                {t("labels.aspectRatio")}: {video.aspect_ratio}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlayVideo(video)}
                disabled={
                  video.status !== "COMPLETED" &&
                  video.status !== "SAVED_TO_R2" &&
                  !video.video_url_r2 &&
                  !video.upsample_video_url_veo3 &&
                  !video.video_url_veo3 &&
                  !video.video_url_volcano &&
                  !video.video_url_fal
                }
                className="w-full sm:w-auto border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayCircle className="mr-2 h-4 w-4" /> Play
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownloadVideo(video)}
                  disabled={
                    video.status !== "COMPLETED" &&
                    video.status !== "SAVED_TO_R2" &&
                    !video.video_url_r2 &&
                    !video.upsample_video_url_veo3 &&
                    !video.video_url_veo3 &&
                    !video.video_url_volcano &&
                    !video.video_url_fal
                  }
                  title={t("downloadButton")}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRegenerateVideo(video)}
                  title={t("regenerateButton")}
                >
                  <RotateCcw className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteVideo(video)}
                  disabled={deletingId === video.id}
                  title="Delete video"
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === video.id ? (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5 text-gray-400 hover:text-red-400" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-12">
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
            {(() => {
              const pageNumbers = [];
              const maxVisiblePages = 5;

              if (totalPages <= maxVisiblePages) {
                // 如果总页数少于或等于最大可见页数，显示所有页码
                for (let i = 1; i <= totalPages; i++) {
                  pageNumbers.push(i);
                }
              } else {
                // 如果总页数大于最大可见页数，智能显示页码
                const startPage = Math.max(1, currentPage - 2);
                const endPage = Math.min(totalPages, currentPage + 2);

                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(i);
                }
              }

              return pageNumbers.map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pageNum);
                    }}
                    isActive={currentPage === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ));
            })()}
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

      {/* Delete Confirmation Dialog */}
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
