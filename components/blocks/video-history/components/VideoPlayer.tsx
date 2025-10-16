import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  onDownload: () => void;
  canDownload: boolean;
  isDownloading: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(({ 
  videoUrl,
  onDownload,
  canDownload,
  isDownloading
}) => {
  return (
    <div className="relative w-full max-w-[518px] group bg-black rounded-lg overflow-hidden">
      <div className="aspect-video w-full">
        <video
          className="rounded-lg w-full h-full object-contain"
          controls
          preload="auto"
          muted
          playsInline
          onLoadedData={(e) => {
            const video = e.target as HTMLVideoElement;
            video.currentTime = 0.1;
          }}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Download button */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
