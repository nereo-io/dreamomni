"use client";

import { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react";
import { useTranslations } from "next-intl";

interface MusicPlayerProps {
  audioUrl: string;
  imageUrl?: string;
  title?: string;
  tags?: string;
  duration?: number;
  onDownload?: () => void;
}

export function MusicPlayer({
  audioUrl,
  imageUrl,
  title,
  tags,
  duration,
  onDownload,
}: MusicPlayerProps) {
  const t = useTranslations("music-generator");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioElement) return;
    audioElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (audioElement) {
      setCurrentTime(audioElement.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioElement) {
      setTotalDuration(audioElement.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioElement) {
      const newTime = parseFloat(e.target.value);
      audioElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" />
            ) : (
              <Play className="h-5 w-5 text-white" />
            )}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={totalDuration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  (currentTime / (totalDuration || 1)) * 100
                }%, #374151 ${(currentTime / (totalDuration || 1)) * 100}%, #374151 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          <button
            onClick={toggleMute}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>

          {onDownload && (
            <button
              onClick={onDownload}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title={t("download") || "Download"}
            >
              <Download className="h-5 w-5" />
            </button>
          )}
        </div>

        <audio
          ref={setAudioElement}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    </div>
  );
}
