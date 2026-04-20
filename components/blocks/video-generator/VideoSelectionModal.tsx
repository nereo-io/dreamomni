"use client";

import { useState, useEffect } from "react";
import { Check, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VideoItem {
  id: string;
  video_url?: string;
  prompt?: string;
  created_at: string;
  status: string;
}

export interface SelectedVideo {
  id: string;
  url: string;
}

interface VideoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (videos: SelectedVideo[]) => void;
  maxSelection: number;
  currentCount: number;
}

export function VideoSelectionModal({
  isOpen,
  onClose,
  onSelect,
  maxSelection,
  currentCount,
}: VideoSelectionModalProps) {
  const t = useTranslations("video-generator");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<SelectedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const remainingSlots = maxSelection - currentCount;

  // Fetch user generated videos
  useEffect(() => {
    if (!isOpen || hasFetched) return;

    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/video-generations/history?limit=50");
        const result = await response.json();

        if (result.code === 0) {
          // Filter out items without video_url and handle case-insensitive status
          const completedVideos = (result.data.data || []).filter((v: VideoItem) => 
            v.video_url && 
            (v.status?.toUpperCase() === "COMPLETED" || v.status?.toUpperCase() === "SAVED_TO_R2")
          );
          setVideos(completedVideos);
          setHasFetched(true);
        }
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [isOpen, hasFetched]);

  const toggleSelection = (video: VideoItem) => {
    const videoUrl = video.video_url;
    if (!videoUrl) return;

    setSelectedVideos((prev) => {
      const existingIndex = prev.findIndex((v) => v.id === video.id);
      if (existingIndex !== -1) {
        return prev.filter((_, idx) => idx !== existingIndex);
      } else if (prev.length < remainingSlots) {
        return [...prev, { id: video.id, url: videoUrl }];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    onSelect(selectedVideos);
    setSelectedVideos([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-gray-900 border-gray-800 p-3 sm:p-6">
        <DialogHeader className="px-0">
          <DialogTitle className="text-white">{t("selectFromCreations")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-3 sm:mx-0 scrollbar-hide">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-400">{t("loadingVideos")}</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-400">{t("noVideosYet")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 sm:p-4">
              {videos.map((video) => {
                const videoUrl = video.video_url;
                if (!videoUrl) return null;

                const isSelected = selectedVideos.some((v) => v.id === video.id);
                const canSelect = selectedVideos.length < remainingSlots;

                return (
                  <div
                    key={video.id}
                    className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all bg-black/40 ${
                      isSelected
                        ? "ring-2 ring-blue-500"
                        : canSelect
                        ? "hover:ring-2 hover:ring-gray-400"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => (canSelect || isSelected) && toggleSelection(video)}
                  >
                    <video
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseOut={(e) => {
                        const v = e.target as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Play className="w-8 h-8 text-white/50" />
                    </div>
                    {isSelected && (
                      <>
                        <div className="absolute inset-0 bg-blue-500/20" />
                        <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1 shadow-lg">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 pt-3 sm:pt-4 px-0">
          <div className="text-xs sm:text-sm text-gray-400">
            {selectedVideos.length > 0 && (
              <span>
                {selectedVideos.length} selected · {remainingSlots - selectedVideos.length} remaining
              </span>
            )}
            {selectedVideos.length === 0 && (
              <span>{t("canUpload", { count: remainingSlots })}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-sm border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedVideos.length === 0}
              className="px-3 sm:px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add {selectedVideos.length > 0 && `(${selectedVideos.length})`}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
