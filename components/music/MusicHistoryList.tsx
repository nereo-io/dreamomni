"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { MusicPlayer } from "./MusicPlayer";
import { MultiAudioPlayer } from "./MultiAudioPlayer";
import { Loader2, Music, AlertCircle } from "lucide-react";
import type { MusicGenerationResult } from "@/hooks/useMusicGeneration";

interface MusicHistoryListProps {
  history: MusicGenerationResult[];
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const getStatusBadge = (status: string, t: any) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: t("status.pending") || "Pending",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    TEXT_GENERATED: {
      label: t("status.textGenerated") || "Lyrics Generated",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    FIRST_TRACK_COMPLETED: {
      label: t("status.firstTrack") || "First Track Ready",
      className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    COMPLETED: {
      label: t("status.completed") || "Completed",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    FAILED: {
      label: t("status.failed") || "Failed",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
};

export function MusicHistoryList({
  history,
  isLoading,
  onLoadMore,
  hasMore,
}: MusicHistoryListProps) {
  const t = useTranslations("music-generator");

  if (isLoading && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-4" />
        <p className="text-gray-400">{t("loadingHistory") || "Loading history..."}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Music className="h-16 w-16 text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">{t("noHistory") || "No generation history yet"}</p>
        <p className="text-gray-500 text-sm mt-2">
          {t("startGenerating") || "Start generating music to see your history here"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div
          key={item.id}
          className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {item.title && (
                <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
              )}
              {item.style && (
                <p className="text-gray-500 text-xs">Style: {item.style}</p>
              )}
            </div>
            <div className="ml-4">{getStatusBadge(item.status, t)}</div>
          </div>

          {(item.status === "COMPLETED" || item.status === "FIRST_TRACK_COMPLETED") && (
            <>
              {/* 如果有多个音频文件，使用 MultiAudioPlayer */}
              {item.audio_files && item.audio_files.length > 0 ? (
                <MultiAudioPlayer
                  audioFiles={item.audio_files}
                  title={item.title}
                  onDownload={(url: string, index: number) => {
                    if (url) {
                      window.open(url, "_blank");
                    }
                  }}
                />
              ) : (
                /* 兼容老数据：单个音频使用原来的 MusicPlayer */
                (item.audio_url || item.audio_url_r2) && (
                  <MusicPlayer
                    audioUrl={item.audio_url_r2 || item.audio_url || ""}
                    imageUrl={item.image_url}
                    title={item.title}
                    tags={item.generated_tags}
                    duration={item.duration_seconds}
                    onDownload={() => {
                      const url = item.audio_url_r2 || item.audio_url;
                      if (url) {
                        window.open(url, "_blank");
                      }
                    }}
                  />
                )
              )}
            </>
          )}

          {item.status === "FAILED" && item.error_message && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{item.error_message}</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              {t("generationType")}: {item.generation_type} | 
              {item.instrumental ? " Instrumental" : " Song"}
            </span>
            <span>
              {new Date(item.created_at || "").toLocaleString()}
            </span>
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading") || "Loading..."}
            </span>
          ) : (
            t("loadMore") || "Load More"
          )}
        </button>
      )}
    </div>
  );
}
