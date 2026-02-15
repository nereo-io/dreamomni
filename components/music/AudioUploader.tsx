"use client";

import { useState } from "react";
import { Music, X, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { uploadAudioToR2 } from "@/lib/upload-utils";

interface AudioUploaderProps {
  onAudioUploaded: (url: string) => void;
  currentAudioUrl?: string;
  disabled?: boolean;
}

export function AudioUploader({
  onAudioUploaded,
  currentAudioUrl,
  disabled = false,
}: AudioUploaderProps) {
  const t = useTranslations("music-generator");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error(t("errors.invalidAudioFormat") || "Please upload an audio file");
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error(t("errors.audioTooLarge") || "Audio file is too large (max 50MB)");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrl = await uploadAudioToR2(file, (progress) => {
        setUploadProgress(progress);
      });

      onAudioUploaded(uploadedUrl);
      toast.success(t("toast.audioUploaded") || "Audio uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    if (!disabled && !isUploading) {
      onAudioUploaded("");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white text-lg font-semibold">
          {t("uploadAudio") || "Upload Audio"}
        </span>
      </div>

      {!currentAudioUrl ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled || isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          } ${
            isDragOver
              ? "border-blue-400 bg-blue-900/50"
              : "border-gray-600 hover:border-gray-500"
          }`}
          onDragOver={!disabled && !isUploading ? handleDragOver : undefined}
          onDragLeave={!disabled && !isUploading ? handleDragLeave : undefined}
          onDrop={!disabled && !isUploading ? handleDrop : undefined}
          onClick={() =>
            !disabled &&
            !isUploading &&
            document.getElementById("audio-upload")?.click()
          }
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-xs mb-4">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-300 mt-2">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Music className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-gray-300">
                  {t("dragAndDropAudio") || "Drag and drop audio file here"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {t("orClickToUpload") || "or click to browse"}
                </p>
              </div>
            </div>
          )}
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            id="audio-upload"
            disabled={disabled || isUploading}
          />
        </div>
      ) : null}

      {!currentAudioUrl && (
        <p className="text-xs text-gray-400 mt-2">
          {t("supportedAudioFormats") || "Supported formats: MP3, WAV, FLAC, OGG (max 50MB)"}
        </p>
      )}

      {currentAudioUrl && (
        <div className="relative border border-gray-600 rounded-lg p-4 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Music className="h-8 w-8 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <audio
                  controls
                  src={currentAudioUrl}
                  className="w-full"
                  style={{ maxHeight: "40px" }}
                >
                  {t("audioNotSupported") || "Your browser does not support audio playback."}
                </audio>
              </div>
            </div>
            {!disabled && !isUploading && (
              <button
                onClick={handleRemove}
                className="ml-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 flex-shrink-0"
                title={t("removeAudio") || "Remove audio"}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
