"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Loader2,
  PlayCircle,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

export interface MediaDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Data
  videoUrl?: string | null;
  posterUrl?: string | null;
  prompt: string;
  inputImages?: string[];
  details: { label: string; value: ReactNode }[];
  statusBadge?: ReactNode;
  errorMessage?: string | null;
  hasAudio?: boolean;
  title?: string;

  // Actions
  onDownload: () => void;
  onDelete: () => void;
  onOpenOriginal: () => void;
  
  // States
  isDownloading?: boolean;
  isDeleting?: boolean;
}

export function MediaDetailModal({
  open,
  onOpenChange,
  videoUrl,
  posterUrl,
  prompt,
  inputImages = [],
  details,
  statusBadge,
  errorMessage,
  hasAudio,
  title = "Media details",
  onDownload,
  onDelete,
  onOpenOriginal,
  isDownloading,
  isDeleting,
}: MediaDetailProps) {
  const isMobile = useIsMobile();
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset expansion state when opening a new item (conceptually when prompt changes)
  useEffect(() => {
    setIsPromptExpanded(false);
  }, [prompt]);

  useEffect(() => {
    if (!open || !videoUrl || !videoRef.current) {
      return;
    }

    const element = videoRef.current;
    element.currentTime = 0;
    element.muted = false;

    const tryPlay = async () => {
      try {
        await element.play();
      } catch (error) {
        element.muted = true;
        try {
          await element.play();
        } catch {
          // Ignore autoplay failures.
        }
      }
    };

    void tryPlay();
  }, [open, videoUrl]);

  const detailBody = (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {/* Media Preview Area */}
      <div className="relative flex items-center justify-center bg-black/80">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl || undefined}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-contain"
          />
        ) : posterUrl ? (
          <img
            src={posterUrl}
            alt={prompt}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <PlayCircle className="h-16 w-16" />
          </div>
        )}
      </div>

      {/* Details & Actions Area */}
      <div className="flex h-full min-h-0 flex-col border-t border-gray-800 md:border-t-0 md:border-l">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-100">{title}</div>
              <div className="flex items-center gap-2">
                {hasAudio && (
                  <Badge className="bg-blue-500/20 text-blue-200 border border-blue-400/40">
                    Audio
                  </Badge>
                )}
                {statusBadge}
              </div>
            </div>

            {/* Prompt Section */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-gray-400">
                Prompt
              </div>
              <p
                className={`text-sm text-gray-100 ${
                  isPromptExpanded ? "" : "line-clamp-3"
                }`}
              >
                {prompt}
              </p>
              {prompt && prompt.length > 120 && (
                <button
                  type="button"
                  onClick={() => setIsPromptExpanded((prev) => !prev)}
                  className="text-xs font-medium text-blue-300 hover:text-blue-200"
                >
                  {isPromptExpanded ? "Collapse" : "Expand"}
                </button>
              )}
            </div>

            {/* Input Images Section */}
            {inputImages.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-gray-400">
                  Input images
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {inputImages.slice(0, 4).map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-800 bg-black/50"
                    >
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

            {/* Metadata Details */}
            <div className="space-y-3">
              {details.map((detail, index) => (
                <DetailRow key={index} label={detail.label} value={detail.value} />
              ))}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                {errorMessage}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-5 md:p-6 border-t border-gray-800 bg-gray-900/30">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={onOpenOriginal}
              disabled={!videoUrl}
              className="w-full bg-gray-800/80 text-gray-100 hover:bg-gray-700"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Open
            </Button>
            <Button
              variant="secondary"
              onClick={onDownload}
              disabled={!videoUrl || isDownloading}
              className="w-full bg-gray-800/80 text-gray-100 hover:bg-gray-700"
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>
            <Button
              variant="secondary"
              onClick={onDelete}
              disabled={isDeleting}
              className="w-full bg-red-500/20 text-red-100 hover:bg-red-500/40"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(prompt);
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
            <DrawerTitle className="text-sm font-semibold">{title}</DrawerTitle>
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
