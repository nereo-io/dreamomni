"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import {
  ImageIcon,
  Film,
  Link2,
  Music,
  Play,
  Plus,
  Trash2,
  UserRound,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CaptchaModal } from "@/components/ui/captcha-modal";
import VideoHistory from "@/components/blocks/video-history";
import useCredits from "@/hooks/useCredits";
import useVideoGeneration, {
  type VideoGenerationParams,
} from "@/hooks/useVideoGeneration";
import { useAppContext } from "@/contexts/app";
import { calculateCredits } from "@/config/video-models";
import { uploadMediaToR2 } from "@/lib/upload-utils";

type OmniMediaKind = "image" | "video";

interface OmniMediaItem {
  url: string;
  kind: OmniMediaKind;
  name: string;
}

const TEXT_MODEL_ID = "kie-gemini-omni-video-text-to-video";
const REFERENCE_MODEL_ID = "kie-gemini-omni-video-image-to-video";
const MAX_UNITS = 7;
const MAX_CHARACTERS = 3;

function getKindFromUrl(url: string): OmniMediaKind {
  const pathname = url.split("?")[0].toLowerCase();
  if (
    pathname.endsWith(".mp4") ||
    pathname.endsWith(".mov") ||
    pathname.endsWith(".webm")
  ) {
    return "video";
  }
  return "image";
}

function isSupportedFile(file: File) {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

export function OmniStudio() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const { leftCredits, updateLeftCredits } = useCredits();
  const { submitGeneration, pollStatus } = useVideoGeneration();

  const [prompt, setPrompt] = useState("");
  const [mediaItems, setMediaItems] = useState<OmniMediaItem[]>([]);
  const [externalUrl, setExternalUrl] = useState("");
  const [audioId, setAudioId] = useState("");
  const [characterInput, setCharacterInput] = useState("");
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [duration, setDuration] = useState("8");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [seed, setSeed] = useState("");
  const [videoStart, setVideoStart] = useState("0");
  const [videoEnd, setVideoEnd] = useState("");
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
  const usedUnits =
    imageItems.length + videoItems.length * 2 + characterIds.length;
  const hasReferenceInput =
    imageItems.length > 0 || videoItems.length > 0 || characterIds.length > 0;
  const selectedModel = hasReferenceInput ? REFERENCE_MODEL_ID : TEXT_MODEL_ID;
  const estimatedCredits = calculateCredits(
    selectedModel,
    Number.parseInt(duration, 10),
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

  const addMediaItem = useCallback(
    (item: OmniMediaItem) => {
      setMediaItems((current) => {
        const nextVideoCount =
          item.kind === "video"
            ? current.filter((media) => media.kind === "video").length + 1
            : current.filter((media) => media.kind === "video").length;
        if (nextVideoCount > 1) {
          toast.error("Gemini Omni supports one source video per request.");
          return current;
        }

        const nextUnits =
          current.filter((media) => media.kind === "image").length +
          current.filter((media) => media.kind === "video").length * 2 +
          characterIds.length +
          (item.kind === "video" ? 2 : 1);

        if (nextUnits > MAX_UNITS) {
          toast.error("Reference limit exceeded. Gemini Omni allows 7 units.");
          return current;
        }

        return [...current, item];
      });
    },
    [characterIds.length]
  );

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!user?.uuid) {
        setShowSignModal(true);
        return;
      }

      const validFiles = files.filter((file) => {
        if (!isSupportedFile(file)) {
          toast.error(`${file.name} is not a supported image or video file.`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        return;
      }

      setIsUploading(true);
      try {
        for (const file of validFiles) {
          const url = await uploadMediaToR2(file);
          addMediaItem({
            url,
            kind: file.type.startsWith("video/") ? "video" : "image",
            name: file.name,
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [addMediaItem, setShowSignModal, user?.uuid]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length > 0) {
      handleFileUpload(files);
    }
    event.target.value = "";
  };

  const handleAddExternalUrl = () => {
    const trimmedUrl = externalUrl.trim();
    if (!trimmedUrl) {
      return;
    }
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      toast.error("Please enter a public http(s) URL.");
      return;
    }
    addMediaItem({
      url: trimmedUrl,
      kind: getKindFromUrl(trimmedUrl),
      name: trimmedUrl.split("/").pop()?.split("?")[0] || "External URL",
    });
    setExternalUrl("");
  };

  const handleAddCharacter = () => {
    const nextId = characterInput.trim();
    if (!nextId) {
      return;
    }
    if (characterIds.includes(nextId)) {
      setCharacterInput("");
      return;
    }
    if (characterIds.length >= MAX_CHARACTERS) {
      toast.error("Gemini Omni supports up to 3 character IDs.");
      return;
    }
    if (usedUnits + 1 > MAX_UNITS) {
      toast.error("Reference limit exceeded. Gemini Omni allows 7 units.");
      return;
    }
    setCharacterIds((current) => [...current, nextId]);
    setCharacterInput("");
  };

  const removeMedia = (index: number) => {
    setMediaItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const removeCharacter = (id: string) => {
    setCharacterIds((current) => current.filter((characterId) => characterId !== id));
  };

  const buildParams = (): VideoGenerationParams => {
    const parsedStart = Number.parseFloat(videoStart);
    const parsedEnd = Number.parseFloat(videoEnd);
    const imageUrls = imageItems.map((item) => item.url);
    const sourceVideo = videoItems[0];
    const characterRefs = characterIds.filter(Boolean);
    const audioRefs = audioId.trim() ? [audioId.trim()] : undefined;

    return {
      model: selectedModel,
      prompt: prompt.trim(),
      duration,
      aspect_ratio: aspectRatio,
      resolution,
      generate_audio: !!audioRefs,
      enable_prompt_enhancement: false,
      image_url: imageUrls[0],
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      media_urls: mediaItems.map((item) => item.url),
      video_list: sourceVideo
        ? [
            {
              url: sourceVideo.url,
              start: Number.isFinite(parsedStart) ? parsedStart : 0,
              ends: Number.isFinite(parsedEnd)
                ? parsedEnd
                : Number.parseInt(duration, 10),
            },
          ]
        : undefined,
      audio_ids: audioRefs,
      character_ids: characterRefs.length > 0 ? characterRefs : undefined,
      seed: seed.trim() ? Number.parseInt(seed.trim(), 10) : undefined,
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
      <section className="flex w-full flex-shrink-0 flex-col rounded-xl bg-gray-900 shadow-lg lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)] lg:w-[520px] lg:overflow-hidden">
        <div className="border-b border-gray-800 px-5 py-4">
          <h1 className="text-xl font-semibold text-white">Omni Studio</h1>
          <p className="mt-1 text-sm leading-6 text-gray-400">
            Text, images, source video, audio IDs, and character IDs in one Gemini Omni request.
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 lg:dark-scrollbar">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Prompt
            </label>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the scene, edits, timing, camera movement, and what each reference should control."
              className="min-h-[160px] resize-none border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
              maxLength={2000}
              disabled={isGenerating}
            />
            <div className="mt-1 text-right text-xs text-gray-500">
              {promptLength}/2000
            </div>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                <SparkUnitIcon />
                References
              </div>
              <span className="text-xs text-gray-500">
                {usedUnits}/{MAX_UNITS} units
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
                placeholder="Paste public image or video URL"
                className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                disabled={isGenerating || !canAddMedia}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddExternalUrl}
                disabled={isGenerating || !canAddMedia}
                className="min-h-[40px]"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Add URL
              </Button>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || isUploading || !canAddMedia}
              className="mt-3 flex min-h-[78px] w-full items-center justify-center gap-3 rounded-lg border border-dashed border-gray-700 bg-gray-900/70 px-4 py-4 text-left transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-300">
                {isUploading ? "Uploading..." : "Upload images or one source video"}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {mediaItems.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {mediaItems.map((item, index) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900"
                  >
                    {item.kind === "image" ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 flex-col items-center justify-center gap-2 text-gray-300">
                        <Film className="h-6 w-6 text-blue-300" />
                        <span className="max-w-full truncate px-3 text-xs">
                          {item.name}
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
                        {item.kind === "image" ? "1 unit" : "2 units"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
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

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-300">
              Duration
              <select
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100"
              >
                {["4", "6", "8", "10"].map((value) => (
                  <option key={value} value={value}>
                    {value}s
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-300">
              Aspect ratio
              <select
                value={aspectRatio}
                onChange={(event) => setAspectRatio(event.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100"
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-300">
              Resolution
              <select
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100"
              >
                <option value="720p">720p</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-300">
              Seed
              <Input
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                placeholder="Optional"
                className="mt-2 border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                inputMode="numeric"
              />
            </label>
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium text-gray-300">
              Audio ID
              <div className="mt-2 flex items-center gap-2">
                <Music className="h-4 w-4 text-gray-500" />
                <Input
                  value={audioId}
                  onChange={(event) => setAudioId(event.target.value)}
                  placeholder="audio_..."
                  className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                />
              </div>
            </label>

            <div>
              <label className="text-sm font-medium text-gray-300">
                Character IDs
              </label>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={characterInput}
                  onChange={(event) => setCharacterInput(event.target.value)}
                  placeholder="character_..."
                  className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddCharacter();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddCharacter}
                  disabled={characterIds.length >= MAX_CHARACTERS}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              {characterIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {characterIds.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => removeCharacter(id)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200 hover:border-gray-500"
                    >
                      <UserRound className="h-3 w-3" />
                      {id}
                      <Trash2 className="h-3 w-3 text-gray-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 bg-gray-900/95 p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-gray-400">Cost</span>
            <button
              type="button"
              onClick={() => setShowPricingModal(true)}
              className="text-gray-100 hover:text-primary"
            >
              {estimatedCredits} credits
            </button>
          </div>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isGenerating || isUploading || !prompt.trim()}
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
        introVideoUrl="https://tempfile.aiquickdraw.com/v/80c8c19b439e9e11c99b79516605df37_1779335619.mp4"
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

function SparkUnitIcon() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
      <Plus className="h-3.5 w-3.5" />
    </span>
  );
}
