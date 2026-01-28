/**
 * AssetModal
 * Lightbox-style modal for displaying asset details (image, video, audio)
 * Features: overlay click to close, centered media, bottom info panel, gallery navigation
 */

"use client";

import { ChevronLeft, ChevronRight, Copy, Download, X, Loader2, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { buildAgentAssetDownloadUrl } from '@/utils/agent-download';
import { trackPlausibleEvent } from '@/utils/plausible';
import { createPortal } from 'react-dom';

type AssetType = 'script' | 'image' | 'video' | 'story' | 'character_refs' | 'scene_ref' | 'audio' | 'shot_ref';

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
    // Legacy props for story/script types (not rendered in lightbox mode)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storyDetails?: any;
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
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const downloadResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  // Client-side only mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  // Reset index when modal opens
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

  // Cleanup download state
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

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

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
        const video = document.querySelector('.lightbox-video') as HTMLVideoElement;
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
  }, [activeType, canNext, canPrev, galleryItems.length, isGalleryMode, isOpen, onClose]);

  const handleCopy = async (text?: string) => {
    const value = text ?? data.content;
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        toast.success(t("assetModal.copied"));
      } catch {
        toast.error(t("toast.copyError") || 'Failed to copy');
      }
    }
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
    if (!activeUrl) return;

    startDownloadFeedback();
    const link = document.createElement('a');
    const ext =
      activeType === 'video'
        ? 'mp4'
        : activeType === 'audio'
          ? 'mp3'
          : 'png';
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
  };

  const getTitle = () => {
    if (activeTitle) return activeTitle;
    if (activeShotNumber) return `${t("assetModal.shot")} #${activeShotNumber}`;
    if (activeType === 'character_refs') return t("assetModal.characterRefs");
    if (activeType === 'scene_ref') return t("assetModal.sceneRef");
    if (activeType === 'shot_ref') return t("assets.ref");
    if (activeType === 'audio') return t("assets.backgroundMusic");
    return activeType.charAt(0).toUpperCase() + activeType.slice(1);
  };

  // Get prompt text for bottom panel
  const keyframePromptText = activeItem?.keyframePrompt
    ? sanitizeKeyframePrompt(activeItem.keyframePrompt, activeItem.shotPrompt)
    : '';
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

  // Handle overlay click (close only when clicking the overlay, not content)
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Navigate to previous/next
  const goPrev = useCallback(() => {
    if (canPrev) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  }, [canPrev]);

  const goNext = useCallback(() => {
    if (canNext) {
      setCurrentIndex((prev) => Math.min(galleryItems.length - 1, prev + 1));
    }
  }, [canNext, galleryItems.length]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      {/* Dark overlay background */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Close button - top right */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Download button - top right, next to close */}
      {activeUrl && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="absolute top-4 right-16 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
          aria-label="Download"
        >
          {isDownloading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Download className="h-6 w-6" />
          )}
        </button>
      )}

      {/* Gallery counter - top left */}
      {hasGalleryNavigation && (
        <div className="absolute top-4 left-4 z-50 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium">
          {currentIndex + 1} / {galleryItems.length}
        </div>
      )}

      {/* Left navigation arrow */}
      {hasGalleryNavigation && (
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Right navigation arrow */}
      {hasGalleryNavigation && (
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Main content area - centered */}
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center justify-center max-w-[90vw] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media content */}
        <div className="relative flex items-center justify-center">
          {/* Loading indicator */}
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

          {/* Image */}
          {(activeType === 'image' ||
            activeType === 'character_refs' ||
            activeType === 'scene_ref' ||
            activeType === 'shot_ref') &&
            activeUrl && (
              <img
                src={activeUrl}
                alt={getTitle()}
                className="max-w-[85vw] max-h-[70vh] object-contain rounded-lg shadow-2xl"
                onLoad={() => setIsMediaLoading(false)}
                onError={() => setIsMediaLoading(false)}
                style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
              />
            )}

          {/* Video */}
          {activeType === 'video' && activeUrl && (
            <video
              src={activeUrl}
              controls
              autoPlay
              className="lightbox-video max-w-[85vw] max-h-[70vh] rounded-lg shadow-2xl"
              preload="auto"
              onLoadedData={() => setIsMediaLoading(false)}
              onError={() => setIsMediaLoading(false)}
              style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
            >
              {t("assetModal.videoNotSupported")}
            </video>
          )}

          {/* Audio */}
          {activeType === 'audio' && activeUrl && (
            <div className="flex flex-col items-center gap-6 p-8 bg-white/5 rounded-2xl">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 flex items-center justify-center">
                <Music className="h-12 w-12 text-emerald-300" />
              </div>
              <audio
                src={activeUrl}
                controls
                autoPlay
                preload="auto"
                className="w-80"
                onLoadedData={() => setIsMediaLoading(false)}
                onError={() => setIsMediaLoading(false)}
                style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
              >
                {t("assetModal.videoNotSupported")}
              </audio>
            </div>
          )}

          {/* Script/Story text content */}
          {(activeType === 'script' || activeType === 'story') && data.content && (
            <div className="bg-gray-900/90 rounded-2xl p-6 max-w-2xl max-h-[70vh] overflow-auto">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                {data.content}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Bottom info panel */}
      <div className="absolute bottom-0 left-0 right-0 z-40">
        <div className="bg-gradient-to-t from-black/80 via-black/60 to-transparent pt-16 pb-6 px-6">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Title */}
            <h3 className="text-white text-lg font-medium text-center">
              {getTitle()}
            </h3>

            {/* Prompt text */}
            {promptText && (
              <div className="relative">
                <p className="text-gray-300 text-sm text-center line-clamp-2 px-8">
                  {promptText}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(promptText)}
                  className="absolute right-0 top-0 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                  aria-label="Copy prompt"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Keyframe reference image for video */}
            {activeType === 'video' && keyframeImageUrl && (
              <div className="flex justify-center">
                <div className="relative h-12 w-20 overflow-hidden rounded-lg border border-white/20">
                  <img
                    src={keyframeImageUrl}
                    alt="Keyframe"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[9px] text-gray-100">
                    REF
                  </span>
                </div>
              </div>
            )}

            {/* Keyboard hint */}
            {(activeType === 'video' || hasGalleryNavigation) && (
              <p className="text-gray-500 text-xs text-center">
                {hasGalleryNavigation && <span>← → {t("assetModal.keyboardHint") || "to navigate"}</span>}
                {hasGalleryNavigation && activeType === 'video' && <span> · </span>}
                {activeType === 'video' && <span>Space to play/pause</span>}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
