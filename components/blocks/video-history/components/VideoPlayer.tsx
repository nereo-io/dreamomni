import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInViewport } from "@/hooks/useInViewport";
import { useAutoLoadMedia } from "@/hooks/useAutoLoadMedia";

interface VideoPlayerProps {
  videoUrl: string;
  onDownload: () => void;
  canDownload: boolean;
  isDownloading: boolean;
  posterUrl?: string | null;
  eagerLoad?: boolean;
  stickyLoad?: boolean;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(({ 
  videoUrl,
  onDownload,
  canDownload,
  isDownloading,
  posterUrl,
  eagerLoad = false,
  stickyLoad = false,
  className
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [controlsBarHeight, setControlsBarHeight] = React.useState(56);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [hasEverLoaded, setHasEverLoaded] = React.useState(false);
  const shouldAutoLoad = useAutoLoadMedia();
  const isInViewport = useInViewport(containerRef, { rootMargin: "200px 0px", threshold: 0.1 });
  const shouldLoadTrigger = eagerLoad || (shouldAutoLoad && isInViewport) || hasInteracted;
  const shouldLoad = stickyLoad ? (shouldLoadTrigger || hasEverLoaded) : shouldLoadTrigger;

  React.useEffect(() => {
    if (stickyLoad && shouldLoadTrigger) {
      setHasEverLoaded(true);
    }
  }, [stickyLoad, shouldLoadTrigger]);

  const updateControlsBarHeight = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const rect = video.getBoundingClientRect();
    if (!rect.height) {
      return;
    }

    const nextHeight = Math.round(
      Math.min(56, Math.max(32, rect.height * 0.2))
    );
    setControlsBarHeight(nextHeight);
  }, []);

  React.useEffect(() => {
    updateControlsBarHeight();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateControlsBarHeight());
      if (videoRef.current) {
        observer.observe(videoRef.current);
      }
      return () => observer.disconnect();
    }

    const handleResize = () => updateControlsBarHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateControlsBarHeight]);

  const handleTogglePlayback = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!shouldLoad) {
      setHasInteracted(true);
      if (!video.src) {
        video.src = videoUrl;
        video.load();
      }
      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
      return;
    }

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-[518px] group bg-black rounded-lg overflow-hidden",
        className
      )}
    >
      <div className="relative aspect-video w-full">
        <video
          ref={videoRef}
          className="rounded-lg w-full h-full object-contain cursor-pointer"
          controls
          poster={posterUrl || undefined}
          src={shouldLoad ? videoUrl : undefined}
          preload={shouldLoad ? "metadata" : "none"}
          playsInline
          onPlay={() => setHasInteracted(true)}
          onLoadedData={(e) => {
            const video = e.target as HTMLVideoElement;
            video.currentTime = 0.1;
            updateControlsBarHeight();
            if (stickyLoad) {
              setHasEverLoaded(true);
            }
          }}
        >
          Your browser does not support the video tag.
        </video>
        <button
          type="button"
          aria-label="Toggle video playback"
          className="absolute left-0 right-0 top-0 z-10 cursor-pointer bg-transparent border-0 p-0"
          style={{ bottom: `${controlsBarHeight}px` }}
          onClick={handleTogglePlayback}
        />
      </div>

      {/* Download button */}
      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!canDownload ? (
          // Example videos - download disabled
          <div className="bg-black/60 text-white border-none h-8 w-8 p-0 rounded-md flex items-center justify-center pointer-events-none">
            <Download className="h-4 w-4 opacity-50" />
          </div>
        ) : (
          // Real videos - download enabled
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/60 hover:bg-black/80 text-white border-none h-8 w-8 p-0 rounded-md pointer-events-auto"
            disabled={isDownloading}
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
