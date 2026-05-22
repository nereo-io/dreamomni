"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { ImageIcon, Film, Info, Play, Trash2, Upload, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CaptchaModal } from "@/components/ui/captcha-modal";
import VideoHistory from "@/components/blocks/video-history";
import { CreditsCostSection } from "@/components/blocks/common/CreditsCostSection";
import useCredits from "@/hooks/useCredits";
import useVideoGeneration, {
  type VideoGenerationParams,
} from "@/hooks/useVideoGeneration";
import { useAppContext } from "@/contexts/app";
import { calculateCredits } from "@/config/video-models";
import { uploadMediaToR2 } from "@/lib/upload-utils";

type OmniMediaKind = "image" | "video";

interface OmniMediaItem {
  id: string;
  url: string;
  kind: OmniMediaKind;
  name: string;
  uploading?: boolean;
}

const TEXT_MODEL_ID = "kie-gemini-omni-video-text-to-video";
const REFERENCE_MODEL_ID = "kie-gemini-omni-video-image-to-video";
const MAX_UNITS = 7;
const MAX_PROMPT = 5000;
const RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "4k", label: "4K" },
];

// KIE Gemini Omni accepts jpeg/png/webp/jpg images (<=10MB each).
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB, per KIE docs
// KIE docs don't state a video size cap; pick a conservative limit (adjust if KIE rejects).
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB (assumption)

function validateFile(file: File): string | null {
  const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
  const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) {
    return `${file.name}: unsupported file type. Use JPEG/PNG/WebP images or MP4/MOV/WebM video.`;
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: image exceeds the 10MB limit.`;
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return `${file.name}: video exceeds the 100MB limit.`;
  }
  return null;
}

export function OmniStudio() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const { leftCredits, updateLeftCredits } = useCredits();
  const { submitGeneration, pollStatus } = useVideoGeneration();

  const [prompt, setPrompt] = useState("");
  const [mediaItems, setMediaItems] = useState<OmniMediaItem[]>([]);
  const [duration, setDuration] = useState("8");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [videoStart, setVideoStart] = useState("0");
  const [videoEnd, setVideoEnd] = useState("");
  const [showReferencesHint, setShowReferencesHint] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [pendingParams, setPendingParams] =
    useState<VideoGenerationParams | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const imageItems = useMemo(
    () => mediaItems.filter((item) => item.kind === "image"),
    [mediaItems]
  );
  const videoItems = useMemo(
    () => mediaItems.filter((item) => item.kind === "video"),
    [mediaItems]
  );
  const usedUnits = imageItems.length + videoItems.length * 2;
  const hasReferenceInput = imageItems.length > 0 || videoItems.length > 0;
  const hasVideo = videoItems.length > 0;
  const selectedModel = hasReferenceInput ? REFERENCE_MODEL_ID : TEXT_MODEL_ID;
  // With a source video, output duration is decided by the model (the duration
  // selector does not take effect), so estimate billing from the trim range instead.
  const billedDuration = useMemo(() => {
    if (!hasVideo) {
      return Number.parseInt(duration, 10);
    }
    const start = Number.parseFloat(videoStart);
    const end = Number.parseFloat(videoEnd);
    const range =
      (Number.isFinite(end) ? end : Number.parseInt(duration, 10)) -
      (Number.isFinite(start) ? start : 0);
    return Math.max(1, Math.round(range));
  }, [hasVideo, duration, videoStart, videoEnd]);
  const estimatedCredits = calculateCredits(
    selectedModel,
    billedDuration,
    false,
    resolution
  );
  const canAddMedia = usedUnits < MAX_UNITS && videoItems.length <= 1;
  const promptLength = prompt.trim().length;
  const needsCaptcha =
    !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
    !!user?.uuid &&
    leftCredits !== null &&
    leftCredits <= 12;

  useEffect(() => {
    if (user?.uuid) {
      updateLeftCredits().catch(console.error);
    }
  }, [updateLeftCredits, user?.uuid]);

  const getMediaLimitError = useCallback(
    (current: OmniMediaItem[], kind: OmniMediaKind) => {
      const currentVideos = current.filter(
        (media) => media.kind === "video"
      ).length;
      if (kind === "video" && currentVideos >= 1) {
        return "Gemini Omni supports one source video per request.";
      }

      const currentUnits =
        current.filter((media) => media.kind === "image").length +
        currentVideos * 2;
      const nextUnits = currentUnits + (kind === "video" ? 2 : 1);
      if (nextUnits > MAX_UNITS) {
        return "Reference limit exceeded. Gemini Omni allows 7 slots.";
      }

      return null;
    },
    []
  );

  const updateMediaItem = useCallback(
    (id: string, patch: Partial<OmniMediaItem>) => {
      setMediaItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const removeMediaById = useCallback((id: string) => {
    setMediaItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!user?.uuid) {
        setShowSignModal(true);
        return;
      }

      const validFiles = files.filter((file) => {
        const error = validateFile(file);
        if (error) {
          toast.error(error);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        return;
      }

      setIsUploading(true);
      try {
        let plannedItems = mediaItems;

        for (const file of validFiles) {
          const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const kind: OmniMediaKind = file.type.startsWith("video/")
            ? "video"
            : "image";
          const limitError = getMediaLimitError(plannedItems, kind);
          if (limitError) {
            toast.error(limitError);
            continue;
          }

          const previewUrl = URL.createObjectURL(file);
          const previewItem: OmniMediaItem = {
            id,
            url: previewUrl,
            kind,
            name: file.name,
            uploading: true,
          };

          // Show a local preview immediately, marked as uploading.
          plannedItems = [...plannedItems, previewItem];
          setMediaItems((current) => [...current, previewItem]);

          try {
            const url = await uploadMediaToR2(file);
            // Swap the local preview for the uploaded URL.
            updateMediaItem(id, { url, uploading: false });
            URL.revokeObjectURL(previewUrl);
          } catch (error) {
            plannedItems = plannedItems.filter((item) => item.id !== id);
            removeMediaById(id);
            URL.revokeObjectURL(previewUrl);
            toast.error(
              error instanceof Error ? error.message : "Upload failed"
            );
          }
        }
      } finally {
        setIsUploading(false);
      }
    },
    [
      getMediaLimitError,
      mediaItems,
      removeMediaById,
      setShowSignModal,
      updateMediaItem,
      user?.uuid,
    ]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length > 0) {
      handleFileUpload(files);
    }
    event.target.value = "";
  };

  const buildParams = (): VideoGenerationParams => {
    const parsedStart = Number.parseFloat(videoStart);
    const parsedEnd = Number.parseFloat(videoEnd);
    const imageUrls = imageItems.map((item) => item.url);
    const sourceVideo = videoItems[0];

    return {
      model: selectedModel,
      prompt: prompt.trim(),
      duration,
      aspect_ratio: aspectRatio,
      resolution,
      generate_audio: false,
      enable_prompt_enhancement: false,
      image_url: imageUrls[0],
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      media_urls: mediaItems.map((item) => item.url),
      video_list: sourceVideo
        ? [
            {
              url: sourceVideo.url,
              start: Number.isFinite(parsedStart) ? parsedStart : 0,
              // Omit `ends` when the user didn't set a trim end; the model decides
              // the output duration for video inputs.
              ...(Number.isFinite(parsedEnd) ? { ends: parsedEnd } : {}),
            },
          ]
        : undefined,
    };
  };

  const runSubmit = async (params: VideoGenerationParams) => {
    setIsGenerating(true);
    try {
      const result = await submitGeneration(params);
      if (result) {
        pollStatus(result.id);
        setRefreshTrigger((current) => current + 1);
        await updateLeftCredits();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please describe the video you want to create.");
      return;
    }
    if (usedUnits > MAX_UNITS) {
      toast.error("Reference limit exceeded. Gemini Omni allows 7 units.");
      return;
    }
    if (leftCredits !== null && leftCredits < estimatedCredits) {
      toast.error("Insufficient credits.");
      setShowPricingModal(true);
      return;
    }

    const params = buildParams();
    if (needsCaptcha) {
      setPendingParams(params);
      setShowCaptchaModal(true);
      return;
    }

    await runSubmit(params);
  };

  const handleCaptchaComplete = async (captchaToken: string) => {
    if (!pendingParams) {
      return;
    }
    setShowCaptchaModal(false);
    const params = { ...pendingParams, captchaToken };
    setPendingParams(null);
    await runSubmit(params);
  };

  return (
    <div className="mb-8 flex w-full flex-col gap-3 lg:h-[calc(100vh-120px)] lg:flex-row">
      <section className="video-generator-container flex w-full flex-shrink-0 flex-col rounded-xl bg-gray-900 shadow-lg lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)] lg:w-[420px] lg:overflow-hidden">
        <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
          <div className="space-y-4 px-4 py-4 md:space-y-5 md:px-6 md:py-5">
            <div className="border-b border-gray-700 pb-3">
              <h1 className="text-xl font-semibold text-white">
                Omni Studio
              </h1>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="text-lg font-semibold text-white">Prompt</div>
                <div className="text-xs text-gray-500">
                  {promptLength}/{MAX_PROMPT}
                </div>
              </div>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the scene, edits, timing, camera movement, and what each reference should control."
                className="mt-0 min-h-[150px] resize-none overflow-y-auto border-gray-600 bg-gray-800 text-gray-100 placeholder:text-gray-400"
                maxLength={MAX_PROMPT}
                disabled={isGenerating}
              />
            </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <div className="text-lg font-semibold text-white">
                  References
                </div>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="flex-shrink-0 text-gray-500 transition-colors hover:text-gray-300"
                        aria-label="References info"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-[240px] p-3 text-xs leading-relaxed"
                    >
                      Each image uses 1 slot, a video uses 2 slots. Up to{" "}
                      {MAX_UNITS} slots and one source video per generation.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xs text-gray-500">
                {usedUnits}/{MAX_UNITS} slots
              </span>
            </div>
            {showReferencesHint && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2">
                <p className="text-xs text-gray-400">
                  Each image uses 1 slot, a video uses 2 slots. Up to{" "}
                  {MAX_UNITS} slots and one source video per generation.
                </p>
                <button
                  type="button"
                  onClick={() => setShowReferencesHint(false)}
                  className="ml-auto flex-shrink-0 rounded p-0.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-200"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating || isUploading || !canAddMedia}
                className="flex min-h-[78px] w-full items-center justify-center gap-3 rounded-lg border border-dashed border-gray-700 bg-gray-900/70 px-4 py-4 text-left transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {isUploading
                    ? "Uploading..."
                    : "Upload images or one source video"}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {mediaItems.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {mediaItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900"
                    >
                      {item.kind === "image" ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-24 w-full object-cover"
                        />
                      ) : (
                        <video
                          src={`${item.url}#t=0.1`}
                          title={item.name}
                          className="h-24 w-full bg-black object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          onMouseEnter={(event) => {
                            if (item.uploading) return;
                            void event.currentTarget.play().catch(() => {});
                          }}
                          onMouseLeave={(event) => {
                            const video = event.currentTarget;
                            video.pause();
                            video.currentTime = 0.1;
                          }}
                        />
                      )}
                      {item.uploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/55">
                          <svg
                            className="h-8 w-8 animate-spin text-white"
                            viewBox="0 0 36 36"
                            fill="none"
                          >
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              stroke="rgba(255,255,255,0.25)"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2 a16 16 0 0 1 16 16"
                              stroke="#fff"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="text-[10px] font-medium text-white">
                            Uploading…
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/70 px-2 py-1">
                        <span className="flex items-center gap-1 text-xs text-gray-200">
                          {item.kind === "image" ? (
                            <ImageIcon className="h-3 w-3" />
                          ) : (
                            <Film className="h-3 w-3" />
                          )}
                          {item.kind === "image" ? "1 slot" : "2 slots"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMediaById(item.id)}
                          className="rounded p-0.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                          aria-label="Remove reference"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {videoItems.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-gray-400">
                    Video start
                    <Input
                      value={videoStart}
                      onChange={(event) => setVideoStart(event.target.value)}
                      className="mt-1 border-gray-700 bg-gray-800 text-gray-100"
                      inputMode="decimal"
                    />
                  </label>
                  <label className="text-xs text-gray-400">
                    Video end
                    <Input
                      value={videoEnd}
                      onChange={(event) => setVideoEnd(event.target.value)}
                      placeholder={duration}
                      className="mt-1 border-gray-700 bg-gray-800 text-gray-100"
                      inputMode="decimal"
                    />
                  </label>
                </div>
              )}
          </div>

          <div>
            <div className="mb-4 text-lg font-semibold text-white">
              Settings
            </div>

            <RadioOptionGroup
              label="Ratio"
              name="omni-aspect-ratio"
              value={aspectRatio}
              options={[
                { value: "16:9", label: "16:9" },
                { value: "9:16", label: "9:16" },
              ]}
              onChange={setAspectRatio}
              disabled={isGenerating}
            />

            {hasVideo ? (
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <label className="block text-sm text-gray-300">
                    Duration
                  </label>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="flex-shrink-0 text-gray-500 transition-colors hover:text-gray-300"
                          aria-label="Duration info"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-[240px] p-3 text-xs leading-relaxed"
                      >
                        Duration follows the source video trim range and is
                        decided by the model.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-sm font-medium text-gray-200">
                  {billedDuration}s
                </div>
              </div>
            ) : (
              <RadioOptionGroup
                label="Duration"
                name="omni-duration"
                value={duration}
                options={["4", "6", "8", "10"].map((value) => ({
                  value,
                  label: `${value}s`,
                }))}
                onChange={setDuration}
                disabled={isGenerating}
              />
            )}

            <RadioOptionGroup
              label="Resolution"
              name="omni-resolution"
              value={resolution}
              options={RESOLUTION_OPTIONS}
              onChange={setResolution}
              disabled={isGenerating}
            />
          </div>
        </div>
        </div>

        <div className="border-t border-gray-800 bg-gray-900/95 p-5">
          <CreditsCostSection
            leftCredits={leftCredits}
            estimatedCost={estimatedCredits}
            onShowPricing={() => setShowPricingModal(true)}
            labels={{
              credits: "Credits",
              cost: "Cost",
              recharge: "Recharge",
            }}
            className="mb-4 border border-gray-800 bg-gray-800/80"
          />
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isGenerating ||
              isUploading ||
              !prompt.trim() ||
              (leftCredits !== null && leftCredits < estimatedCredits)
            }
            className="min-h-[44px] w-full"
          >
            <Play className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate with Omni"}
          </Button>
        </div>
      </section>

      <VideoHistory
        refreshTrigger={refreshTrigger}
        selectedModel={selectedModel}
        mode={hasReferenceInput ? "image-to-video" : "text-to-video"}
        introVideoUrl="https://r2.seedance.tv/intro/gemini%20omin/YTDown_YouTube_Introducing-Gemini-Omni-Create-Anything-_Media_KUyRq7szZsM_002_720p.mp4"
      />

      <CaptchaModal
        isOpen={showCaptchaModal}
        onClose={() => {
          setShowCaptchaModal(false);
          setPendingParams(null);
        }}
        onCaptchaComplete={handleCaptchaComplete}
        isSubmitting={isGenerating}
      />
    </div>
  );
}

function RadioOptionGroup({
  label,
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm text-gray-300">{label}</label>
      <div className="flex flex-wrap gap-3 sm:gap-6">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className="flex min-w-0 cursor-pointer items-center text-sm text-gray-300"
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className="sr-only"
              />
              <span
                className={`mr-2 flex h-4 w-4 flex-shrink-0 rounded-full border-2 ${
                  selected ? "border-primary bg-primary" : "border-gray-500"
                }`}
              >
                {selected && (
                  <span className="m-0.5 h-2 w-2 rounded-full bg-white" />
                )}
              </span>
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
