"use client";

import { useState, useCallback, useRef } from "react";
import { X, Upload, ImageIcon, Film, Music, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  uploadMediaToR2,
  getMediaType,
  type MediaType,
} from "@/lib/upload-utils";
import { ImageSelectionModal, type SelectedImage } from "./ImageSelectionModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MediaItem {
  url: string;
  type: MediaType;
  name: string;
}

interface MediaGridUploaderProps {
  maxMedia?: number;
  onMediaChange: (mediaUrls: string[], mediaItems: MediaItem[]) => void;
  isAuthenticated: boolean;
  onShowSignModal: () => void;
}

const ACCEPTED_TYPES = "image/*,video/mp4,video/quicktime,audio/mpeg,audio/wav";

function getMediaIcon(type: MediaType) {
  switch (type) {
    case "video":
      return <Film className="h-5 w-5 text-blue-400" />;
    case "audio":
      return <Music className="h-5 w-5 text-green-400" />;
    default:
      return <ImageIcon className="h-5 w-5 text-gray-400" />;
  }
}

function getMediaLabel(type: MediaType, index: number, t: any) {
  switch (type) {
    case "image":
      return `${t("mediaTypeImage")} ${index}`;
    case "video":
      return `${t("mediaTypeVideo")} ${index}`;
    case "audio":
      return `${t("mediaTypeAudio")} ${index}`;
    default:
      return `${t("mediaTypeFile")} ${index}`;
  }
}

export function MediaGridUploader({
  maxMedia = 12,
  onMediaChange,
  isAuthenticated,
  onShowSignModal,
}: MediaGridUploaderProps) {
  const t = useTranslations("video-generator");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const notifyParent = useCallback(
    (items: MediaItem[]) => {
      onMediaChange(
        items.map((item) => item.url),
        items
      );
    },
    [onMediaChange]
  );

  const handleFilesUpload = useCallback(
    async (files: File[]) => {
      if (!isAuthenticated) {
        onShowSignModal();
        return;
      }

      const remainingSlots = maxMedia - mediaItems.length;
      if (remainingSlots <= 0) {
        toast.error(t("mediaMaxError", { max: maxMedia }));
        return;
      }

      const validFiles = files.filter((file) => {
        const type = getMediaType(file);
        if (type === "unknown") {
          toast.error(t("mediaUnsupportedType", { name: file.name }));
          return false;
        }
        return true;
      });

      const filesToUpload = validFiles.slice(0, remainingSlots);
      if (validFiles.length > remainingSlots) {
        toast.warning(t("mediaOnlyUploadingFirst", { count: remainingSlots }));
      }

      setIsUploading(true);
      setUploadProgress({ current: 0, total: filesToUpload.length });

      const uploaded: MediaItem[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress({ current: i + 1, total: filesToUpload.length });
        try {
          const url = await uploadMediaToR2(filesToUpload[i]);
          uploaded.push({
            url,
            type: getMediaType(filesToUpload[i]),
            name: filesToUpload[i].name,
          });
        } catch (error) {
          console.error("Media upload error:", error);
          const reason = error instanceof Error ? error.message : String(error);
          toast.error(`${t("mediaUploadFailed")}: ${reason}`);
        }
      }

      if (uploaded.length > 0) {
        const allItems = [...mediaItems, ...uploaded];
        setMediaItems(allItems);
        notifyParent(allItems);
      }

      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    },
    [isAuthenticated, maxMedia, mediaItems, notifyParent, onShowSignModal, t]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFilesUpload(Array.from(files));
      }
      e.target.value = "";
    },
    [handleFilesUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFilesUpload(files);
      }
    },
    [handleFilesUpload]
  );

  const removeMedia = useCallback(
    (index: number) => {
      const newItems = mediaItems.filter((_, itemIndex) => itemIndex !== index);
      setMediaItems(newItems);
      notifyParent(newItems);
    },
    [mediaItems, notifyParent]
  );

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUploading && mediaItems.length < maxMedia && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSelectFromCreations = useCallback(
    (selections: SelectedImage[]) => {
      if (selections.length === 0) return;

      const remainingSlots = maxMedia - mediaItems.length;
      const toAdd = selections.slice(0, remainingSlots);

      if (selections.length > remainingSlots) {
        toast.warning(t("mediaOnlyUploadingFirst", { count: remainingSlots }));
      }

      const newItems: MediaItem[] = toAdd.map((selection) => ({
        url: selection.url,
        type: "image",
        name: selection.id,
      }));
      const allItems = [...mediaItems, ...newItems];
      setMediaItems(allItems);
      notifyParent(allItems);
    },
    [maxMedia, mediaItems, notifyParent, t]
  );

  const typeCounts = { image: 0, video: 0, audio: 0 };
  const itemLabels = mediaItems.map((item) => {
    typeCounts[item.type as keyof typeof typeCounts] =
      (typeCounts[item.type as keyof typeof typeCounts] || 0) + 1;
    return getMediaLabel(
      item.type,
      typeCounts[item.type as keyof typeof typeCounts],
      t
    );
  });

  const hasItems = mediaItems.length > 0;
  const canAddMore = mediaItems.length < maxMedia;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">
            {t("mediaUploadTitle")}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-700/80 bg-gray-900/60 text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200"
                aria-label={t("mediaUploadHint")}
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-80 border-gray-700 bg-gray-900/95 p-3 text-gray-100 shadow-xl"
            >
              <p className="text-sm leading-6 text-gray-200">
                {t("mediaUploadHint")}
              </p>
              <p className="mt-2 border-t border-gray-800 pt-2 text-xs leading-5 text-gray-400">
                {t("mediaSupportedTypes")}
              </p>
            </PopoverContent>
          </Popover>
        </div>
        {hasItems && (
          <span className="text-xs text-gray-500">
            {mediaItems.length}/{maxMedia}
          </span>
        )}
      </div>

      {!hasItems && (
        <div
          className={`relative rounded-lg border-2 border-dashed px-4 py-5 transition-all ${
            isDragOver
              ? "border-blue-500 bg-blue-500/10"
              : "border-gray-600 bg-gray-900/50 hover:border-gray-500"
          } ${isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
              <p className="text-sm text-blue-400">
                {t("mediaUploading", {
                  current: uploadProgress.current,
                  total: uploadProgress.total,
                })}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Upload className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-sm text-gray-300">
                  {t("mediaUploadPrompt", { max: maxMedia })}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <span>{t("mediaUploadSecondaryHint")}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      onShowSignModal();
                    } else {
                      setIsModalOpen(true);
                    }
                  }}
                  className="text-sm text-gray-500 underline hover:text-blue-400"
                >
                  {t("selectFromCreations")}
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}

      {hasItems && (
        <>
          {canAddMore && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                isDragOver
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-700 bg-gray-900/50 hover:border-gray-500"
              } ${isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500" />
                  <span className="text-xs text-blue-400">
                    {t("mediaUploading", {
                      current: uploadProgress.current,
                      total: uploadProgress.total,
                    })}
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {t("mediaUploadMore", {
                      remaining: maxMedia - mediaItems.length,
                    })}
                  </span>
                  <span className="mx-1 text-gray-600">|</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAuthenticated) {
                        onShowSignModal();
                      } else {
                        setIsModalOpen(true);
                      }
                    }}
                    className="text-xs text-gray-500 underline hover:text-blue-400"
                  >
                    {t("selectFromCreations")}
                  </button>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {mediaItems.map((item, index) => (
              <div
                key={`${item.url}-${index}`}
                className="group relative overflow-hidden rounded-lg bg-gray-800"
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={itemLabels[index]}
                    className="h-16 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-full flex-col items-center justify-center gap-0.5">
                    {getMediaIcon(item.type)}
                    <span className="max-w-full truncate px-1 text-[10px] text-gray-400">
                      {item.name}
                    </span>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                  <span className="text-[10px] text-gray-300">
                    {itemLabels[index]}
                  </span>
                </div>

                <button
                  onClick={() => removeMedia(index)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  aria-label={`Remove ${itemLabels[index]}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <ImageSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectFromCreations}
        maxSelection={maxMedia}
        currentCount={mediaItems.length}
      />
    </div>
  );
}

export type { MediaItem };
