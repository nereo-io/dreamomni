import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  onDownload: (url: string) => void;
  canDownload: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(({ 
  videoUrl, 
  onDownload, 
  canDownload 
}) => {
  return (
    <div className="relative inline-block">
      <video
        className="rounded-lg"
        style={{ width: '438px', height: '288px', objectFit: 'contain' }}
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

      {/* Download button */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!canDownload ? (
          // Example videos - download disabled
          <div className="bg-black/60 text-white border-none h-8 w-8 p-0 rounded-md flex items-center justify-center">
            <Download className="h-4 w-4 opacity-50" />
          </div>
        ) : (
          // Real videos - download enabled
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/60 hover:bg-black/80 text-white border-none h-8 w-8 p-0 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(videoUrl);
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;