"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const ITEMS_PER_PAGE = 12;

export default function VideoHistoryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<VideoGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchHistory = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/video-generations/history`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch video history");
      }
      const result = await response.json();
      console.log(result);

      if (result.code === 0 && result.data) {
        setVideos(result.data.data || []);
        setCurrentPage(result.data.pagination?.page || 1);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.total || 0);
      } else {
        throw new Error(result.message || "无数据返回");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get("page") || "1");
    fetchHistory(pageFromUrl);
  }, [searchParams, fetchHistory]);

  const handlePageChange = (newPage: number) => {
    router.push(`/history?page=${newPage}`);
  };

  const handlePlayVideo = (video: VideoGeneration) => {
    // Check for video URL availability
    const videoUrl = video.video_url_r2 || video.video_url_fal;
    if (videoUrl) {
      window.open(videoUrl, "_blank");
    } else {
      toast.info("Video is not available yet.");
    }
  };

  const handleDownloadVideo = (video: VideoGeneration) => {
    const videoUrl = video.video_url_r2 || video.video_url_fal;
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
      toast.error("Video not available for download.");
    }
  };

  const handleRegenerateVideo = (video: VideoGeneration) => {
    // This might involve navigating back to the generator with pre-filled params
    // For simplicity, just logging now. Can be expanded later.
    console.log("Regenerate video:", video);
    toast.info("Regeneration functionality to be implemented.");
    // router.push(`/generate?prompt=${encodeURIComponent(video.prompt)}&aspect_ratio=${video.aspect_ratio}...`);
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
            Completed
          </Badge>
        );
      case "IN_PROGRESS":
      case "IN_QUEUE":
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
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
          No Videos Yet
        </h3>
        <p className="text-gray-400 mb-6">
          You haven't generated any videos. Start creating your first
          masterpiece!
        </p>
        <Button
          asChild
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Link href="/">Generate Video</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">
        Video Generation History
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <Card
            key={video.id}
            className="bg-gray-800 border-gray-700 text-gray-200 flex flex-col"
          >
            <CardHeader>
              <div className="aspect-video bg-gray-700 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                {video.video_url_r2 || video.video_url_fal ? (
                  <video
                    src={video.video_url_r2 ?? video.video_url_fal ?? ""}
                    poster={video.input_image_url ?? ""}
                    className="w-full h-full object-cover"
                    preload="metadata"
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
              <p className="text-sm text-gray-400">Model: {video.model_id}</p>
              <p className="text-sm text-gray-400">
                Duration: {video.duration_seconds}s
              </p>
              <p className="text-sm text-gray-400">
                Aspect Ratio: {video.aspect_ratio}
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
                    !video.video_url_fal
                  }
                  title="Download"
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRegenerateVideo(video)}
                  title="Regenerate"
                >
                  <RotateCcw className="h-5 w-5 text-gray-400 hover:text-gray-200" />
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
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(i + 1);
                  }}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
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
  );
}
