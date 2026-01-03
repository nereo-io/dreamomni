"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Download, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AudioFile } from "@/hooks/useMusicGeneration";

interface MultiAudioPlayerProps {
  audioFiles: AudioFile[];
  title?: string;
  onDownload?: (url: string, index: number) => void;
}

export function MultiAudioPlayer({
  audioFiles,
  title,
  onDownload,
}: MultiAudioPlayerProps) {
  const t = useTranslations("music-generator");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(audioFiles[0]?.duration_seconds || 0);
  const audioElementsRef = useRef<(HTMLAudioElement | null)[]>([]);

  // 初始化时设置第一个音频的总时长
  useEffect(() => {
    if (audioFiles[0]?.duration_seconds) {
      setTotalDuration(audioFiles[0].duration_seconds);
    }
  }, [audioFiles]);

  if (!audioFiles || audioFiles.length === 0) {
    return null;
  }

  const selectedAudio = audioFiles[selectedIndex];
  const currentAudioElement = audioElementsRef.current[selectedIndex];

  const togglePlay = () => {
    if (!currentAudioElement) return;

    if (isPlaying) {
      currentAudioElement.pause();
    } else {
      // 暂停所有其他音频
      audioElementsRef.current.forEach((audio, idx) => {
        if (audio && idx !== selectedIndex) {
          audio.pause();
        }
      });
      currentAudioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!currentAudioElement) return;
    currentAudioElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (currentAudioElement) {
      setCurrentTime(currentAudioElement.currentTime);
    }
  };

  const handleLoadedMetadata = (index: number) => () => {
    const audio = audioElementsRef.current[index];
    if (audio && audio.duration && index === selectedIndex) {
      setTotalDuration(audio.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentAudioElement) {
      const newTime = parseFloat(e.target.value);
      currentAudioElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleAudioSelect = (index: number) => {
    // 暂停当前播放
    if (currentAudioElement && isPlaying) {
      currentAudioElement.pause();
      setIsPlaying(false);
    }
    setSelectedIndex(index);
    setCurrentTime(0);
    
    // 更新总时长为新选中音频的时长
    const newAudio = audioElementsRef.current[index];
    if (newAudio && newAudio.duration) {
      setTotalDuration(newAudio.duration);
    } else {
      // 如果音频元素还没有加载，尝试从 audioFiles 数据中获取
      const selectedFile = audioFiles[index];
      if (selectedFile?.duration_seconds) {
        setTotalDuration(selectedFile.duration_seconds);
      } else {
        setTotalDuration(0);
      }
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const setAudioElement = useCallback((index: number) => (element: HTMLAudioElement | null) => {
    audioElementsRef.current[index] = element;
  }, []);

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      {/* 播放控制区 */}
      <div className="space-y-3">
        {/* 播放控制器 */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={!selectedAudio?.audio_url}
            className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
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
            disabled={!selectedAudio?.audio_url}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>

          {onDownload && selectedAudio?.audio_url && (
            <button
              onClick={() => onDownload(selectedAudio.audio_url!, selectedIndex)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title={t("download") || "Download"}
            >
              <Download className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* 音频列表 - 横向展示在一行（只有多个音频时显示） */}
      {audioFiles.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {audioFiles.map((audioFile, index) => {
            const audioUrl = audioFile.audio_url || "";
            const duration = audioFile.duration_seconds;
            
            return (
              <div key={index} className="flex-shrink-0">
                <div
                  onClick={() => handleAudioSelect(index)}
                  className={`
                    cursor-pointer rounded-lg w-32 h-32 border-2 transition-all flex flex-col items-center justify-center gap-2 p-3
                    ${selectedIndex === index
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 hover:border-gray-600 bg-gray-900/30"
                    }
                  `}
                >
                  {/* 波形图标 */}
                  <div className="flex items-center gap-0.5">
                    <div className={`w-1 ${selectedIndex === index ? 'h-6 bg-blue-400' : 'h-4 bg-gray-500'} rounded-full transition-all`}></div>
                    <div className={`w-1 ${selectedIndex === index ? 'h-8 bg-blue-400' : 'h-6 bg-gray-500'} rounded-full transition-all`}></div>
                    <div className={`w-1 ${selectedIndex === index ? 'h-4 bg-blue-400' : 'h-3 bg-gray-500'} rounded-full transition-all`}></div>
                    <div className={`w-1 ${selectedIndex === index ? 'h-10 bg-blue-400' : 'h-8 bg-gray-500'} rounded-full transition-all`}></div>
                    <div className={`w-1 ${selectedIndex === index ? 'h-5 bg-blue-400' : 'h-4 bg-gray-500'} rounded-full transition-all`}></div>
                  </div>
                  
                  {/* 播放状态指示 */}
                  {selectedIndex === index && isPlaying && (
                    <Pause className="h-5 w-5 text-blue-400" />
                  )}
                  
                  {/* 标题和时长 */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">
                      {t("track") || "Track"} {index + 1}
                    </p>
                    {duration && (
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(duration)}
                      </p>
                    )}
                  </div>
                </div>

                {/* 隐藏的 audio 元素 */}
                <audio
                  ref={setAudioElement(index)}
                  src={audioUrl}
                  onTimeUpdate={selectedIndex === index ? handleTimeUpdate : undefined}
                  onLoadedMetadata={handleLoadedMetadata(index)}
                  onEnded={() => {
                    if (selectedIndex === index) {
                      setIsPlaying(false);
                    }
                  }}
                  className="hidden"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 单个音频时的隐藏 audio 元素 */}
      {audioFiles.length === 1 && (
        <audio
          ref={setAudioElement(0)}
          src={audioFiles[0].audio_url || ""}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata(0)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}

