"use client"

import type React from "react"
import { ImageIcon } from "lucide-react"
import VideoGenerator from "../video-generator"
import VideoResult from "../video-result"
import useVideoGeneration from "@/hooks/useVideoGeneration"

interface VideoGenerationToolProps {
  // 通用属性
  description: string
  setDescription: (value: string) => void
  isGenerating: boolean
  generatedVideo: string | null
  selectedRatio: string
  setSelectedRatio: (ratio: string) => void
  selectedDuration: string
  setSelectedDuration: (duration: string) => void
  selectedResolution: string
  setSelectedResolution: (resolution: string) => void
  onGenerate: () => void

  // 条件属性
  mode: "text-to-video" | "image-to-video"

  // 图片相关属性（仅在 image-to-video 模式下使用）
  selectedImage?: string | null
  setSelectedImage?: (image: string | null) => void
  onImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void

  // 占位符配置
  placeholderIcon: React.ReactNode
  placeholderText: string

  // 描述字段标签
  descriptionLabel?: string
  descriptionPlaceholder?: string
}

export function VideoGenerationTool({
  description,
  setDescription,
  isGenerating,
  generatedVideo,
  selectedRatio,
  setSelectedRatio,
  selectedDuration,
  setSelectedDuration,
  selectedResolution,
  setSelectedResolution,
  onGenerate,
  mode,
  selectedImage,
  setSelectedImage,
  onImageUpload,
  placeholderIcon,
  placeholderText,
  descriptionLabel = "Video Description",
  descriptionPlaceholder = "Describe the video you want to create, e.g., A cat playing in a sunny garden with natural lighting and fresh atmosphere...",
}: VideoGenerationToolProps) {
  const {
    currentGeneration,
    updateCurrentGeneration,
  } = useVideoGeneration()

  // Handle retry
  const handleRetry = () => {
    if (currentGeneration?.id) {
      // 重新轮询状态
      onGenerate()
    } else {
      // 重新生成
      onGenerate()
    }
  }

  return (
    <div className="max-w-7xl mx-auto mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Controls */}
        <VideoGenerator
          description={description}
          setDescription={setDescription}
          isGenerating={isGenerating}
          selectedRatio={selectedRatio}
          setSelectedRatio={setSelectedRatio}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          selectedResolution={selectedResolution}
          setSelectedResolution={setSelectedResolution}
          onGenerate={onGenerate}
          mode={mode}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          onImageUpload={onImageUpload}
          descriptionLabel={descriptionLabel}
          descriptionPlaceholder={descriptionPlaceholder}
        />

        {/* Right Column - Generation Result */}
        <VideoResult
          generation={currentGeneration}
          generatedVideo={generatedVideo}
          isGenerating={isGenerating}
          placeholderIcon={placeholderIcon}
          placeholderText={placeholderText}
          onRetry={handleRetry}
          onVideoUrlUpdate={(videoUrl: string) => {
            updateCurrentGeneration({ video_url: videoUrl })
          }}
        />
      </div>
    </div>
  )
}