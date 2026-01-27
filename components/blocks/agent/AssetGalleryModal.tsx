/**
 * AssetGalleryModal
 * Gallery modal for browsing media assets with thumbnails and prompt copy.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Copy, Download, Image, Loader2, Music, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { buildAgentAssetDownloadUrl } from '@/utils/agent-download';
import { trackPlausibleEvent } from '@/utils/plausible';

type GalleryAssetType = 'image' | 'video' | 'audio' | 'character_refs' | 'scene_ref' | 'shot_ref';

interface GalleryAsset {
  id: string;
  type: GalleryAssetType;
  url?: string;
  title?: string;
  shotNumber?: number;
  durationSeconds?: number;
  fileSize?: number;
  assetId?: string;
  assetType?: string;
  backgroundUrl?: string;
}

interface AssetGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: GalleryAsset[];
  initialIndex?: number;
  prompt?: string;
  jobId?: string;
  userId?: string;
}

export function AssetGalleryModal({
  open,
  onOpenChange,
  items,
  initialIndex = 0,
  prompt,
  jobId,
  userId,
}: AssetGalleryModalProps) {
  const t = useTranslations('agentJobs');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const safeIndex = Math.max(0, Math.min(initialIndex, items.length - 1));
    setCurrentIndex(safeIndex);
  }, [open, initialIndex, items.length]);

  const current = items[currentIndex];
  const hasMultiple = items.length > 1;
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < items.length - 1;

  useEffect(() => {
    if (open && current) {
      setIsMediaLoading(true);
    }
  }, [open, currentIndex, current?.url, current?.type]);

  useEffect(() => {
    if (!open) {
      setIsDownloading(false);
      if (downloadResetTimer.current) {
        clearTimeout(downloadResetTimer.current);
        downloadResetTimer.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (downloadResetTimer.current) {
        clearTimeout(downloadResetTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open || !hasMultiple) return;
      if (event.key === 'ArrowLeft' && canPrev) {
        event.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
      if (event.key === 'ArrowRight' && canNext) {
        event.preventDefault();
        setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, hasMultiple, canPrev, canNext, items.length]);

  const handleCopyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success(t('item.promptCopied'));
    } catch (error) {
      toast.error(t('toast.copyError'));
    }
  };

  const getTitle = () => {
    if (current?.title) return current.title;
    if (current?.shotNumber) return `${t('assets.shot')} #${current.shotNumber}`;
    switch (current?.type) {
      case 'character_refs':
        return t('assets.characterRefs');
      case 'scene_ref':
        return t('assets.sceneRef');
      case 'audio':
        return t('assets.backgroundMusic');
      case 'video':
        return t('assets.video');
      case 'image':
      case 'shot_ref':
      default:
        return t('assets.image');
    }
  };

  const getDownloadFilename = () => {
    const fallbackExt =
      current?.type === 'video' ? 'mp4' : current?.type === 'audio' ? 'mp3' : 'png';
    const ext = current?.url ? current.url.split('?')[0]?.split('.').pop() || fallbackExt : fallbackExt;
    const base = current?.shotNumber ? `shot_${current.shotNumber}` : `asset_${currentIndex + 1}`;
    return `${base}.${ext}`;
  };

  const getAssetTypeForTracking = () => {
    if (current?.assetType) return current.assetType;
    switch (current?.type) {
      case 'character_refs':
        return 'character_ref';
      case 'scene_ref':
        return 'scene_ref';
      case 'audio':
        return 'background_music';
      case 'video':
        return 'clip';
      case 'shot_ref':
      case 'image':
      default:
        return 'image';
    }
  };

  const getFileTypeForTracking = () => {
    if (current?.type === 'video') return 'video';
    if (current?.type === 'audio') return 'audio';
    return 'image';
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
    if (!current?.url) return;

    startDownloadFeedback();

    const filename = getDownloadFilename();
    const fileExt = current.url.split('?')[0]?.split('.').pop() || filename.split('.').pop() || '';
    const assetType = getAssetTypeForTracking();

    trackPlausibleEvent('ai_shorts_asset_download_completed', {
      user_id: userId,
      job_id: jobId,
      asset_id: current.assetId,
      asset_type: assetType,
      file_type: getFileTypeForTracking(),
      file_ext: fileExt,
      file_size: current.fileSize,
      duration_seconds: current.durationSeconds,
      shot_number: current.shotNumber,
      download_source: 'asset_gallery',
      download_method: 'button_click',
      timestamp: new Date().toISOString(),
    });

    const downloadUrl = current.assetId
      ? buildAgentAssetDownloadUrl(current.assetId, filename, 'asset_gallery')
      : current.url;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.click();
  };

  const renderMedia = () => {
    if (!current?.url) {
      return (
        <div className="text-sm text-gray-400">{t('assetModal.videoNotSupported')}</div>
      );
    }

    if (
      current.type === 'image' ||
      current.type === 'character_refs' ||
      current.type === 'scene_ref' ||
      current.type === 'shot_ref'
    ) {
      return (
        <img
          src={current.url}
          alt={getTitle()}
          className="max-w-full max-h-[70vh] object-contain rounded"
          onLoad={() => setIsMediaLoading(false)}
          onError={() => setIsMediaLoading(false)}
          style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
        />
      );
    }

    if (current.type === 'audio') {
      return (
        <audio
          src={current.url}
          controls
          autoPlay
          preload="auto"
          className="w-full"
          onLoadedData={() => setIsMediaLoading(false)}
          onError={() => setIsMediaLoading(false)}
          style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
        >
          {t('assetModal.videoNotSupported')}
        </audio>
      );
    }

    return (
      <video
        src={current.url}
        controls
        autoPlay
        className="w-full max-h-[70vh]"
        preload="auto"
        onLoadedData={() => setIsMediaLoading(false)}
        onError={() => setIsMediaLoading(false)}
        style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
      >
        {t('assetModal.videoNotSupported')}
      </video>
    );
  };

  const getThumbnailUrl = (item: GalleryAsset) => {
    if (item.type === 'video') return item.backgroundUrl;
    if (item.type === 'audio') return undefined;
    return item.url;
  };

  const renderThumbnail = (item: GalleryAsset) => {
    const thumbnailUrl = getThumbnailUrl(item);
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

  if (!items.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-gray-800 border-gray-700 text-gray-200 flex flex-col">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle className="text-gray-100">{getTitle()}</DialogTitle>
            <span className="text-xs text-gray-400">
              {currentIndex + 1}/{items.length}
            </span>
            {current?.url && (
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
                {t('assetModal.download')}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto pr-1 space-y-4">
          {prompt && (
            <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                <span>{t('gallery.promptLabel')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-gray-300 hover:bg-white/10"
                  onClick={handleCopyPrompt}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {t('item.copyPrompt')}
                </Button>
              </div>
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {prompt}
              </p>
            </div>
          )}

          <div className="relative bg-gray-900 rounded-lg overflow-hidden min-h-[60vh] flex items-center justify-center">
            {isMediaLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className="block w-3 h-3 rounded-full bg-white/60 animate-[agent-loader-bounce_1.2s_ease-in-out_infinite]"
                      style={{ animationDelay: `${index * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasMultiple && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => canPrev && setCurrentIndex((prev) => prev - 1)}
                  disabled={!canPrev}
                  className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 bg-gray-900/80 hover:bg-gray-800/90",
                    !canPrev && "opacity-40"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => canNext && setCurrentIndex((prev) => prev + 1)}
                  disabled={!canNext}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 bg-gray-900/80 hover:bg-gray-800/90",
                    !canNext && "opacity-40"
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {renderMedia()}
          </div>
        </div>

        {hasMultiple && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md border border-white/10",
                    index === currentIndex && "ring-2 ring-white/70"
                  )}
                  title={item.title}
                >
                  {renderThumbnail(item)}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
