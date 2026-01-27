/**
 * AssetModal
 * Unified modal for displaying asset details (script, image, video)
 * Uses shadcn Dialog component with keyboard navigation support
 */

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Copy, Download, Image, Loader2, Music, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { buildAgentAssetDownloadUrl } from '@/utils/agent-download';
import { trackPlausibleEvent } from '@/utils/plausible';

type AssetType = 'script' | 'image' | 'video' | 'story' | 'character_refs' | 'scene_ref' | 'audio' | 'shot_ref';

interface UsedResource {
  id: string;
  type?: string;
  description?: string;
}

interface GalleryItem {
  id: string;
  type: AssetType;
  assetId?: string;
  assetType?: string;
  url?: string;
  title?: string;
  shotNumber?: number;
  durationSeconds?: number;
  fileSize?: number;
  backgroundUrl?: string;
  prompt?: string;
  shotPrompt?: string;
  keyframePrompt?: string;
  keyframeReferenceUrls?: string[];
  keyframeUrl?: string;
  usedResources?: UsedResource[];
}

interface StoryAct {
  title?: string;
  summary?: string;
  description?: string;
}

interface StoryOutline {
  logline?: string;
  conflict?: string;
  ending?: string;
  sound_bed?: string;
  theme?: string;
  tone?: string;
  acts?: StoryAct[];
}

interface StoryElement {
  id?: string;
  description?: string;
}

interface StoryboardShotDetail {
  shot_number?: number;
  duration_seconds?: number;
  start_frame_brief?: string;
  story_description?: string;
  start_frame_element_refs?: string[];
}

interface StoryShotDetail {
  number?: number;
  duration?: number;
  prompt?: string;
  keyframePrompt?: string;
  keyframeMetadata?: Record<string, any> | null;
  keyframeStatus?: string;
  keyframeModelUsed?: string | null;
  keyframeAttempts?: Array<Record<string, any>> | null;
  videoStatus?: string;
  videoModelUsed?: string | null;
  videoAttempts?: Array<Record<string, any>> | null;
  videoErrorMessage?: string | null;
}

interface StoryDetails {
  outline?: StoryOutline;
  characters?: StoryElement[];
  scene?: StoryElement | null;
  storyboardShots?: StoryboardShotDetail[];
  shots?: StoryShotDetail[];
  storyboardJson?: Record<string, any> | null;
}

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AssetType;
  data: {
    assetId?: string;
    assetType?: string;
    jobId?: string;
    userId?: string;
    url?: string;
    content?: string;
    title?: string;
    shotNumber?: number;
    durationSeconds?: number;
    fileSize?: number;
    storyDetails?: StoryDetails;
    totalDurationSeconds?: number;
    shotsCount?: number;
  };
  gallery?: {
    items: GalleryItem[];
    initialIndex?: number;
  };
}

export function AssetModal({ isOpen, onClose, type, data, gallery }: AssetModalProps) {
  const t = useTranslations("agentJobs");
  const [isCopied, setIsCopied] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const galleryItems = gallery?.items ?? [];
  const [currentIndex, setCurrentIndex] = useState(gallery?.initialIndex ?? 0);
  const isGalleryMode = galleryItems.length > 0;
  const activeItem = isGalleryMode ? galleryItems[currentIndex] : undefined;
  const activeType = activeItem?.type ?? type;
  const activeUrl = activeItem?.url ?? data.url;
  const activeTitle = activeItem?.title ?? data.title;
  const activeShotNumber = activeItem?.shotNumber ?? data.shotNumber;
  const activeDurationSeconds = activeItem?.durationSeconds ?? data.durationSeconds;
  const activeFileSize = activeItem?.fileSize ?? data.fileSize;
  const activeAssetId = activeItem?.assetId ?? data.assetId;
  const activeAssetType = activeItem?.assetType ?? data.assetType;
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < galleryItems.length - 1;
  const hasGalleryNavigation = isGalleryMode && galleryItems.length > 1;

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatStatusLabel = (status?: string) => {
    if (!status) return '';
    switch (status) {
      case 'done':
        return t("assetModal.done");
      case 'failed':
        return t("assetModal.failed");
      case 'generating':
      case 'generating_keyframes':
      case 'generating_videos':
        return t("assetModal.generating");
      case 'skipped':
        return t("assetModal.skipped");
      default:
        return status
          .split('_')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
    }
  };

  const getStatusBadgeClasses = (status?: string) => {
    switch (status) {
      case 'done':
        return 'border-emerald-400/30 text-emerald-300';
      case 'failed':
        return 'border-rose-400/40 text-rose-300';
      case 'generating':
      case 'generating_keyframes':
      case 'generating_videos':
        return 'border-amber-300/30 text-amber-200';
      default:
        return 'border-white/20 text-gray-200';
    }
  };

  const sanitizeKeyframePrompt = (prompt?: string, shotPrompt?: string) => {
    if (!prompt) return '';
    let result = prompt.trim();

    if (shotPrompt) {
      const trimmedShotPrompt = shotPrompt.trim();
      if (trimmedShotPrompt && result.includes(trimmedShotPrompt)) {
        result = result.replace(trimmedShotPrompt, '').trim();
      }
    }

    const contextIndex = result.toLowerCase().indexOf('shot context');
    if (contextIndex !== -1) {
      result = result.slice(0, contextIndex).trim();
    }

    return result || prompt;
  };

  useEffect(() => {
    if (!isOpen || !isGalleryMode) return;
    const safeIndex = Math.max(0, Math.min(gallery?.initialIndex ?? 0, galleryItems.length - 1));
    setCurrentIndex(safeIndex);
  }, [isOpen, isGalleryMode, gallery?.initialIndex, galleryItems.length]);

  // Reset media loading state when modal opens or data changes
  useEffect(() => {
    if (
      isOpen &&
      (activeType === 'image' ||
        activeType === 'character_refs' ||
        activeType === 'scene_ref' ||
        activeType === 'shot_ref' ||
        activeType === 'video' ||
        activeType === 'audio')
    ) {
      setIsMediaLoading(true);
    } else {
      setIsMediaLoading(false);
    }
  }, [isOpen, activeUrl, activeType]);

  useEffect(() => {
    if (!isOpen) {
      setIsDownloading(false);
      if (downloadResetTimer.current) {
        clearTimeout(downloadResetTimer.current);
        downloadResetTimer.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (downloadResetTimer.current) {
        clearTimeout(downloadResetTimer.current);
      }
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // ESC key is handled by Dialog component
      // Add space key for video pause/play
      if (isGalleryMode && e.key === 'ArrowLeft' && canPrev) {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (isGalleryMode && e.key === 'ArrowRight' && canNext) {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(galleryItems.length - 1, prev + 1));
        return;
      }

      if (activeType === 'video' && e.code === 'Space') {
        e.preventDefault();
        const video = document.querySelector('video');
        if (video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeType, canNext, canPrev, galleryItems.length, isGalleryMode, isOpen]);

  const handleCopy = async (text?: string, updateState = false) => {
    const value = text ?? data.content;
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        if (updateState) {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        }
        toast.success(t("assetModal.copied"));
      } catch (error) {
        toast.error(t("toast.copyError") || 'Failed to copy');
      }
    }
  };

  const getDownloadableTextContent = () => {
    if (type === 'script' && data.content) return data.content;

    if (type === 'story' && data.storyDetails) {
      const {
        storyboardJson,
        outline,
        characters = [],
        scene,
        storyboardShots = [],
        shots = [],
      } = data.storyDetails;

      if (storyboardJson && typeof storyboardJson === 'object') {
        return JSON.stringify(storyboardJson, null, 2);
      }

      const keyElements: Array<Record<string, any>> = [];
      characters.forEach((char, index) => {
        if (!char) return;
        keyElements.push({
          id: char.id || `Character_${index + 1}`,
          type: 'character',
          description: char.description,
        });
      });
      if (scene) {
        keyElements.push({
          id: scene.id || 'Scene',
          type: 'scene',
          description: scene.description,
        });
      }

      const payload: Record<string, any> = {
        story_outline: outline || {},
        storyboard: {
          key_elements: keyElements,
          shots: storyboardShots.map((shot, index) => ({
            shot_number: shot.shot_number ?? index + 1,
            duration_seconds: shot.duration_seconds,
            start_frame_brief: shot.start_frame_brief,
            story_description: shot.story_description,
            start_frame_element_refs: shot.start_frame_element_refs,
          })),
        },
      };

      if (shots.length > 0) {
        payload.shots = shots.map((shot) => ({
          shot_number: shot.number,
          duration_seconds: shot.duration,
          prompt: shot.prompt,
          keyframe_prompt: shot.keyframePrompt,
          keyframe_status: shot.keyframeStatus,
          keyframe_model_used: shot.keyframeModelUsed,
          video_status: shot.videoStatus,
          model_used: shot.videoModelUsed,
          attempts: shot.videoAttempts,
          video_error_message: shot.videoErrorMessage,
        }));
      }
      if (typeof data.totalDurationSeconds === 'number') {
        payload.total_duration_seconds = data.totalDurationSeconds;
      }
      if (typeof data.shotsCount === 'number') {
        payload.shots_count = data.shotsCount;
      }

      return JSON.stringify(payload, null, 2);
    }

    return null;
  };

  const startDownloadFeedback = () => {
    setIsDownloading(true);
    if (downloadResetTimer.current) {
      clearTimeout(downloadResetTimer.current);
    }
    downloadResetTimer.current = setTimeout(() => {
      setIsDownloading(false);
      downloadResetTimer.current = null;
    }, 3000);
  };

  const handleDownload = () => {
    if (activeUrl) {
      startDownloadFeedback();
      const link = document.createElement('a');
      const ext =
        activeType === 'video'
          ? 'mp4'
          : activeType === 'audio'
          ? 'mp3'
          : activeType === 'image' || activeType === 'character_refs' || activeType === 'scene_ref' || activeType === 'shot_ref'
          ? 'png'
          : activeType === 'story' || activeType === 'script'
          ? 'json'
          : 'txt';
      const filename = `${activeType}_${activeShotNumber || 'asset'}.${ext}`;
      if (['image', 'video', 'audio', 'character_refs', 'scene_ref', 'shot_ref'].includes(activeType)) {
        const fileType =
          activeType === 'audio'
            ? 'audio'
            : activeType === 'video'
            ? 'video'
            : 'image';
        const assetType =
          activeAssetType ||
          (activeType === 'character_refs'
            ? 'character_ref'
            : activeType === 'scene_ref'
            ? 'scene_ref'
            : activeType === 'audio'
            ? 'background_music'
            : activeType === 'video'
            ? 'clip'
            : 'image');
        const fileExt = activeUrl ? activeUrl.split('?')[0]?.split('.').pop() || ext : ext;

        trackPlausibleEvent('ai_shorts_asset_download_completed', {
          user_id: data.userId,
          job_id: data.jobId,
          asset_id: activeAssetId,
          asset_type: assetType,
          file_type: fileType,
          file_ext: fileExt,
          file_size: activeFileSize,
          duration_seconds: activeDurationSeconds,
          shot_number: activeShotNumber,
          download_source: 'asset_modal',
          download_method: 'button_click',
          timestamp: new Date().toISOString(),
        });
      }
      link.href =
        activeAssetId && ['image', 'video', 'audio', 'character_refs', 'scene_ref', 'shot_ref'].includes(activeType)
          ? buildAgentAssetDownloadUrl(activeAssetId, filename, 'asset_modal')
          : activeUrl;
      link.download = filename;
      link.click();
      return;
    }

    const content = getDownloadableTextContent();
    if (!content) return;

    startDownloadFeedback();
    const blob = new Blob([content], {
      type: type === 'story' || type === 'script' ? 'application/json' : 'text/plain',
    });
    const objectUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${type}_${data.shotNumber || 'asset'}.${type === 'story' || type === 'script' ? 'json' : 'txt'}`;
    link.click();
    window.URL.revokeObjectURL(objectUrl);
  };

  const getTitle = () => {
    if (activeTitle) return activeTitle;
    if (activeShotNumber) return `${t("assetModal.shot")} #${activeShotNumber} ${activeType}`;
    if (activeType === 'story') return t("assetModal.storyboard");
    if (activeType === 'character_refs') return t("assetModal.characterRefs");
    if (activeType === 'scene_ref') return t("assetModal.sceneRef");
    if (activeType === 'shot_ref') return t("assets.ref");
    if (activeType === 'audio') return t("assets.backgroundMusic");
    return activeType.charAt(0).toUpperCase() + activeType.slice(1);
  };

  const renderStoryDetails = () => {
    if (!data.storyDetails) {
      return data.content ? (
        <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
          {data.content}
        </pre>
      ) : null;
    }

    const {
      outline,
      characters = [],
      scene,
      storyboardShots = [],
      shots = [],
    } = data.storyDetails;
    const acts = outline?.acts ?? [];
    const theme = outline?.theme;
    const tone = outline?.tone;
    const logline = outline?.logline;
    const conflict = outline?.conflict;
    const ending = outline?.ending;
    const soundBed = outline?.sound_bed;

    const shotsValue =
      typeof data.shotsCount === 'number'
        ? data.shotsCount
        : shots.length > 0
        ? shots.length
        : storyboardShots.length > 0
        ? storyboardShots.length
        : undefined;

    return (
      <div className="space-y-6">
        {/* Compact summary line */}
        <div className="flex items-center gap-3 text-sm text-gray-300 border-b border-white/5 pb-4">
          <span className="font-semibold text-white text-base">
            {typeof shotsValue === 'number' ? shotsValue : '—'} {t("assetModal.shots")}
          </span>
          <span className="text-gray-500">·</span>
          <span>{formatDuration(data.totalDurationSeconds)}</span>
          {acts.length > 0 && (
            <>
              <span className="text-gray-500">·</span>
              <span>{acts.length} {t("assetModal.acts")}</span>
            </>
          )}
          {characters.length > 0 && (
            <>
              <span className="text-gray-500">·</span>
              <span>{characters.length} {t("assetModal.characters")}</span>
            </>
          )}
          {scene && (
            <>
              <span className="text-gray-500">·</span>
              <span>1 {t("assetModal.scene")}</span>
            </>
          )}
        </div>

        {(logline || conflict || ending || soundBed || theme || tone) && (
          <section className="rounded-xl border border-white/5 bg-black/30 px-4 py-4 space-y-3">
            <div className="text-xs uppercase tracking-wide text-gray-400">{t("assetModal.storyOutline")}</div>
            {(logline || conflict || ending || soundBed) && (
              <div className="space-y-2 text-sm text-gray-200">
                {logline && (
                  <div>
                    <span className="text-gray-500">{t("assetModal.logline")}:</span>{' '}
                    <span>{logline}</span>
                  </div>
                )}
                {conflict && (
                  <div>
                    <span className="text-gray-500">{t("assetModal.conflict")}:</span>{' '}
                    <span>{conflict}</span>
                  </div>
                )}
                {ending && (
                  <div>
                    <span className="text-gray-500">{t("assetModal.ending")}:</span>{' '}
                    <span>{ending}</span>
                  </div>
                )}
                {soundBed && (
                  <div>
                    <span className="text-gray-500">{t("assetModal.soundBed")}:</span>{' '}
                    <span>{soundBed}</span>
                  </div>
                )}
              </div>
            )}
            {(theme || tone) && (
              <div className="text-sm text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                {theme && <span>{t("assetModal.theme")}: {theme}</span>}
                {tone && <span>{t("assetModal.tone")}: {tone}</span>}
              </div>
            )}
          </section>
        )}

        {acts.length > 0 && (
          <Accordion type="single" collapsible defaultValue="acts" className="rounded-xl border border-white/5 bg-black/30">
            <AccordionItem value="acts" className="border-none">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-300 hover:no-underline">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="uppercase tracking-wide">{t("assetModal.actsUpper")}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-normal">
                    {acts.map((act, index) => (
                      <span key={index}>
                        {index > 0 && <span className="mx-1">→</span>}
                        {act.title || `${t("assetModal.acts")} ${index + 1}`}
                      </span>
                    ))}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {acts.map((act, index) => (
                    <div key={`${act.title}-${index}`} className="border-l-2 border-white/10 pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{act.title || `${t("assetModal.acts")} ${index + 1}`}</span>
                        <Badge variant="outline" className="border-white/15 text-[10px] text-gray-400">
                          {t("assetModal.acts")} {index + 1}
                        </Badge>
                      </div>
                      {(act.summary || act.description) && (
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {act.summary || act.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {(characters.length > 0 || scene) && (
          <Accordion
            type="single"
            collapsible
            defaultValue="elements"
            className="rounded-xl border border-white/5 bg-black/30"
          >
            <AccordionItem value="elements" className="border-none">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-300 hover:no-underline">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="uppercase tracking-wide">{t("assetModal.elementsUpper")}</span>
                  <div className="flex flex-wrap gap-2">
                    {characters.map((char, index) => (
                      <Badge
                        key={`char-${index}`}
                        variant="outline"
                        className="border-white/20 text-gray-200 text-xs font-normal"
                      >
                        {char.id || `${t("assetModal.character")} ${index + 1}`}
                      </Badge>
                    ))}
                    {scene && (
                      <Badge
                        variant="outline"
                        className="border-white/20 text-gray-200 text-xs font-normal"
                      >
                        {scene.id || t("assetModal.scene")}
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {characters.map((character, index) => (
                    <div
                      key={`${character.id || index}`}
                      className="border-l-2 border-white/10 pl-3 space-y-2"
                    >
                      <div className="text-xs uppercase tracking-wide text-gray-400">
                        {t("assetModal.character")}
                      </div>
                      <div className="text-base font-semibold text-white">
                        {character.id || `${t("assetModal.character")} ${index + 1}`}
                      </div>
                      {character.description && (
                        <p className="text-sm text-gray-300">{character.description}</p>
                      )}
                    </div>
                  ))}
                  {scene && (
                    <div className="border-l-2 border-white/10 pl-3 space-y-2">
                      <div className="text-xs uppercase tracking-wide text-gray-400">{t("assetModal.scene")}</div>
                      <div className="text-base font-semibold text-white">{scene.id || t("assetModal.scene")}</div>
                      {scene.description && (
                        <p className="text-sm text-gray-300">{scene.description}</p>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {storyboardShots.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300">{t("assetModal.storyboard")}</h4>
            <Accordion
              type="multiple"
              defaultValue={storyboardShots.map((shot, index) => `storyboard-shot-${shot.shot_number ?? index}`)}
              className="rounded-xl border border-white/5 bg-black/30 divide-y divide-white/5"
            >
              {storyboardShots.map((shot, index) => {
                const itemValue = `storyboard-shot-${shot.shot_number ?? index}`;
                const elementRefs = Array.isArray(shot.start_frame_element_refs)
                  ? shot.start_frame_element_refs
                  : [];

                return (
                  <AccordionItem key={itemValue} value={itemValue} className="border-none">
                    <AccordionTrigger className="text-left px-4 py-3 text-gray-100 hover:no-underline">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">
                          {t("assetModal.shot")} #{shot.shot_number ?? index + 1}
                        </span>
                        {shot.duration_seconds && (
                          <Badge variant="outline" className="border-white/15 text-gray-200 text-xs">
                            {formatDuration(shot.duration_seconds)}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3">
                        {shot.start_frame_brief && (
                          <div className="space-y-1">
                            <div className="text-xs uppercase tracking-wide text-gray-400">{t("assetModal.startFrame")}</div>
                            <p className="text-sm text-gray-200 whitespace-pre-wrap">
                              {shot.start_frame_brief}
                            </p>
                          </div>
                        )}
                        {shot.story_description && (
                          <div className="space-y-1">
                            <div className="text-xs uppercase tracking-wide text-gray-400">{t("assetModal.story")}</div>
                            <p className="text-sm text-gray-200 whitespace-pre-wrap">
                              {shot.story_description}
                            </p>
                          </div>
                        )}
                        {elementRefs.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {elementRefs.map((ref) => (
                              <Badge
                                key={ref}
                                variant="outline"
                                className="border-white/20 text-gray-200 text-xs"
                              >
                                {ref}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>
        )}

        {shots.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300">{t("assetModal.shots")}</h4>
            <Accordion
              type="multiple"
              defaultValue={shots.map((shot, index) => `shot-${shot.number ?? index}`)}
              className="rounded-xl border border-white/5 bg-black/30 divide-y divide-white/5"
            >
              {shots.map((shot, index) => {
                const itemValue = `shot-${shot.number ?? index}`;
                const keyframePromptText = shot.keyframePrompt
                  ? sanitizeKeyframePrompt(shot.keyframePrompt, shot.prompt)
                  : null;
                const videoAttemptsText =
                  shot.videoAttempts && shot.videoAttempts.length > 0
                    ? JSON.stringify(shot.videoAttempts, null, 2)
                    : null;

                return (
                  <AccordionItem
                    key={itemValue}
                    value={itemValue}
                    className="border-none"
                  >
                  <AccordionTrigger className="text-left px-4 py-3 text-gray-100 hover:no-underline">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm">
                        {t("assetModal.shot")} #{shot.number ?? index + 1}
                      </span>
                      {shot.duration && (
                        <Badge variant="outline" className="border-white/15 text-gray-200 text-xs">
                          {formatDuration(shot.duration)}
                        </Badge>
                      )}
                      {shot.keyframeStatus === 'done' && (
                        <Badge variant="outline" className="border-emerald-400/30 text-emerald-300 text-xs">
                          {t("assetModal.keyframePrompt")} {t("assetModal.done")}
                        </Badge>
                      )}
                      {shot.keyframeStatus === 'skipped' && (
                        <Badge variant="outline" className="border-white/15 text-gray-200 text-xs">
                          {t("assetModal.keyframePrompt")} {t("assetModal.skipped")}
                        </Badge>
                      )}
                      {shot.keyframeStatus === 'failed' && (
                        <Badge variant="outline" className="border-rose-400/40 text-rose-300 text-xs">
                          {t("assetModal.keyframePrompt")} {t("assetModal.failed")}
                        </Badge>
                      )}
                      {shot.videoStatus === 'generating' && (
                        <Badge variant="outline" className="border-amber-300/30 text-amber-200 text-xs">
                          {t("assetModal.generating")}
                        </Badge>
                      )}
                      {shot.videoStatus === 'done' && (
                        <Badge variant="outline" className="border-emerald-400/30 text-emerald-300 text-xs">
                          {t("assets.video")} {t("assetModal.done")}
                        </Badge>
                      )}
                      {shot.videoStatus === 'failed' && (
                        <Badge variant="outline" className="border-rose-400/40 text-rose-300 text-xs">
                          {t("assets.video")} {t("assetModal.failed")}
                        </Badge>
                      )}
                      {shot.videoModelUsed && (
                        <Badge variant="outline" className="border-white/15 text-gray-200 text-xs">
                          {t("assetModal.model")}: {shot.videoModelUsed}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {keyframePromptText && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                              <span>{t("assetModal.keyframePrompt")}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-gray-300 hover:bg-white/10"
                                onClick={() => handleCopy(keyframePromptText)}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                {t("assetModal.copy")}
                              </Button>
                            </div>
                            <pre className="bg-black/40 rounded-lg p-3 text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                              {keyframePromptText}
                            </pre>
                          </div>
                        )}
                        {shot.prompt && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                              <span>{t("assetModal.shotPrompt")}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-gray-300 hover:bg-white/10"
                                onClick={() => handleCopy(shot.prompt)}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                {t("assetModal.copy")}
                              </Button>
                            </div>
                            <pre className="text-sm leading-relaxed text-gray-100 bg-white/5 rounded-lg p-3 whitespace-pre-wrap">
                              {shot.prompt}
                            </pre>
                          </div>
                        )}

                        {(shot.videoErrorMessage || videoAttemptsText) && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                              <span>{t("assetModal.videoRouting")}</span>
                              {videoAttemptsText && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-gray-300 hover:bg-white/10"
                                  onClick={() => handleCopy(videoAttemptsText)}
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1" />
                                  {t("assetModal.copyAttempts")}
                                </Button>
                              )}
                            </div>
                            {shot.videoErrorMessage && (
                              <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 whitespace-pre-wrap break-words">
                                {shot.videoErrorMessage}
                              </div>
                            )}
                            {videoAttemptsText && (
                              <pre className="bg-black/40 rounded-lg p-3 text-xs text-gray-100 whitespace-pre-wrap leading-relaxed">
                                {videoAttemptsText}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>
        )}
      </div>
    );
  };

  const renderPromptBlock = (label: string, value: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
        <span>{label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-gray-300 hover:bg-white/10"
          onClick={() => handleCopy(value)}
        >
          <Copy className="h-3.5 w-3.5 mr-1" />
          {t("assetModal.copy")}
        </Button>
      </div>
      <p className="bg-black/40 rounded-lg px-3 py-2 text-sm text-gray-100 whitespace-pre-wrap leading-relaxed break-words line-clamp-3">
        {value}
      </p>
    </div>
  );

  const renderGalleryNavigation = () => {
    if (!hasGalleryNavigation) return null;
    return (
      <>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => canPrev && setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={!canPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 bg-gray-900/80 hover:bg-gray-800/90 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => canNext && setCurrentIndex((prev) => Math.min(galleryItems.length - 1, prev + 1))}
          disabled={!canNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 bg-gray-900/80 hover:bg-gray-800/90 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </>
    );
  };

  const renderThumbnail = (item: GalleryItem) => {
    const thumbnailUrl =
      item.type === 'video'
        ? item.backgroundUrl || item.url
        : item.type === 'audio'
        ? undefined
        : item.url;

    if (thumbnailUrl) {
      return (
        <img
          src={thumbnailUrl}
          alt={item.title || ''}
          className="h-full w-full object-cover"
        />
      );
    }

    if (item.type === 'audio') {
      return (
        <div className="flex h-full w-full items-center justify-center bg-gray-800 text-emerald-200">
          <Music className="h-5 w-5" />
        </div>
      );
    }

    if (item.type === 'video') {
      return (
        <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-200">
          <PlayCircle className="h-5 w-5" />
        </div>
      );
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-200">
        <Image className="h-5 w-5" />
      </div>
    );
  };

  const keyframePromptText = activeItem?.keyframePrompt
    ? sanitizeKeyframePrompt(activeItem.keyframePrompt, activeItem.shotPrompt)
    : '';
  const keyframeReferenceUrls = Array.isArray(activeItem?.keyframeReferenceUrls)
    ? activeItem.keyframeReferenceUrls.filter(Boolean)
    : [];
  const keyframeImageUrl = activeItem?.keyframeUrl;
  const promptText = (() => {
    if (!activeItem) return '';
    if (activeType === 'image') {
      return keyframePromptText || activeItem.prompt || activeItem.shotPrompt || '';
    }
    if (activeType === 'video') {
      return activeItem.shotPrompt || activeItem.prompt || '';
    }
    return activeItem.prompt || '';
  })();
  const showReferenceImages = activeType === 'image' && keyframeReferenceUrls.length > 0;
  const showKeyframeImage = activeType === 'video' && !!keyframeImageUrl;
  const shouldShowMetaSection = !!promptText || showReferenceImages || showKeyframeImage;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gray-800 border-gray-700 text-gray-200">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle className="text-gray-100">{getTitle()}</DialogTitle>
            {isGalleryMode && (
              <span className="text-xs text-gray-400">
                {currentIndex + 1}/{galleryItems.length}
              </span>
            )}
            {(activeType === 'script' || activeType === 'story') && getDownloadableTextContent() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(getDownloadableTextContent() || undefined, true)}
                className="h-8 text-gray-400 hover:text-gray-100 hover:bg-gray-700/50"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                {isCopied ? t("assetModal.copied") : t("assetModal.copy")}
              </Button>
            )}
            {(activeUrl || getDownloadableTextContent()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 text-gray-400 hover:text-gray-100 hover:bg-gray-700/50 ml-auto"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                )}
                {t("assetModal.download")}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="mt-4 overflow-auto max-h-[calc(90vh-120px)] pr-1 space-y-6">
          {shouldShowMetaSection && (
            <section className="space-y-4">
              {(showReferenceImages || showKeyframeImage) && (
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-gray-400">
                    REF
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {showReferenceImages &&
                      keyframeReferenceUrls.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="relative h-16 w-24 overflow-hidden rounded-lg border border-white/10 bg-black/30"
                        >
                          <img
                            src={url}
                            alt={`REF#${index + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-gray-100">
                            REF#{index + 1}
                          </span>
                        </div>
                      ))}
                    {showKeyframeImage && keyframeImageUrl && (
                      <div
                        className="relative h-16 w-24 overflow-hidden rounded-lg border border-white/10 bg-black/30"
                      >
                        <img
                          src={keyframeImageUrl}
                          alt="REF#1"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-gray-100">
                          REF#1
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {promptText && renderPromptBlock(t("gallery.promptLabel"), promptText)}
            </section>
          )}
          {/* Script */}
          {activeType === 'script' && data.content && (
            <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
              {data.content}
            </pre>
          )}

          {/* Story Details */}
          {activeType === 'story' && renderStoryDetails()}

          {/* Image */}
          {(activeType === 'image' ||
            activeType === 'character_refs' ||
            activeType === 'scene_ref' ||
            activeType === 'shot_ref') &&
            activeUrl && (
            <div className="relative flex items-center justify-center bg-gray-900 rounded-lg p-4 min-h-[60vh]">
              {isMediaLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map(index => (
                      <span
                        key={index}
                        className="block w-3 h-3 rounded-full bg-white/60 animate-[agent-loader-bounce_1.2s_ease-in-out_infinite]"
                        style={{ animationDelay: `${index * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {renderGalleryNavigation()}
              <img
                src={activeUrl}
                alt={getTitle()}
                className="max-w-full max-h-[70vh] object-contain rounded"
                onLoad={() => setIsMediaLoading(false)}
                onError={() => setIsMediaLoading(false)}
                style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
              />
            </div>
          )}

          {/* Video */}
          {activeType === 'video' && activeUrl && (
            <div className="relative bg-gray-900 rounded-lg overflow-hidden min-h-[60vh] flex items-center justify-center">
              {isMediaLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map(index => (
                      <span
                        key={index}
                        className="block w-3 h-3 rounded-full bg-white/60 animate-[agent-loader-bounce_1.2s_ease-in-out_infinite]"
                        style={{ animationDelay: `${index * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {renderGalleryNavigation()}
              <video
                src={activeUrl}
                controls
                autoPlay
                className="w-full max-h-[70vh]"
                preload="auto"
                onLoadedData={() => setIsMediaLoading(false)}
                onError={() => setIsMediaLoading(false)}
                style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
              >
                {t("assetModal.videoNotSupported")}
              </video>
            </div>
          )}

          {/* Audio */}
          {activeType === 'audio' && activeUrl && (
            <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center p-6">
              {isMediaLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map(index => (
                      <span
                        key={index}
                        className="block w-3 h-3 rounded-full bg-white/60 animate-[agent-loader-bounce_1.2s_ease-in-out_infinite]"
                        style={{ animationDelay: `${index * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {renderGalleryNavigation()}
              <audio
                src={activeUrl}
                controls
                autoPlay
                preload="auto"
                className="w-full"
                onLoadedData={() => setIsMediaLoading(false)}
                onError={() => setIsMediaLoading(false)}
                style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
              >
                {t("assetModal.videoNotSupported")}
              </audio>
            </div>
          )}

          {hasGalleryNavigation && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md border border-white/10 ${
                      index === currentIndex ? 'ring-2 ring-white/70' : ''
                    }`}
                    title={item.title}
                  >
                    {renderThumbnail(item)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hint for keyboard shortcuts */}
        {activeType === 'video' && (
          <div className="text-xs text-gray-500 text-center mt-2">
            {t("assetModal.keyboardHint")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
