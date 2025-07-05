"use client"

import { Button } from "@/components/ui/button"
import { Play, Download } from "lucide-react"

interface GenerationResultProps {
  generatedVideo: string | null
  isGenerating: boolean
  placeholderIcon: React.ReactNode
  placeholderText: string
}

export function GenerationResult({
  generatedVideo,
  isGenerating,
  placeholderIcon,
  placeholderText,
}: GenerationResultProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-white text-lg font-semibold mb-3">Generated Video</h2>
      
      <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
        {generatedVideo ? (
          <>
            <img
              src={generatedVideo}
              alt="Generated video"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex space-x-4">
                <Button
                  variant="ghost"
                  size="lg"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3"
                >
                  <Play className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3"
                >
                  <Download className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </>
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Generating your video...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a few minutes</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {placeholderIcon}
            <p className="text-gray-400">{placeholderText}</p>
          </div>
        )}
      </div>
    </div>
  )
}