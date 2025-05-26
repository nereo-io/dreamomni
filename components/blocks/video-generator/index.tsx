"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Image as ImageIcon, X, Play } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import VideoResult from "@/components/blocks/video-result";

interface VideoGeneratorProps {
  placeholder?: string;
}

type VideoAspectRatio = "16:9" | "9:16" | "1:1";
type VideoDuration = "5" | "10";

export default function VideoGenerator({
  placeholder = "Describe the video you want to create, e.g., A cat playing in a sunny garden with natural lighting and fresh atmosphere...",
}: VideoGeneratorProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [duration, setDuration] = useState<VideoDuration>("5");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { user, setShowSignModal } = useAppContext();
  const {
    isLoading,
    currentGeneration,
    submitGeneration,
    pollStatus,
    clearCurrentGeneration,
  } = useVideoGeneration();

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Image size cannot exceed 10MB");
      return;
    }

    setUploadedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleImageUpload(files[0]);
      }
    },
    [handleImageUpload]
  );

  // Handle click upload
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  // Handle video generation
  const handleGenerate = async () => {
    if (!user?.uuid) {
      toast.message("Please sign in first");
      setShowSignModal(true);
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a video description");
      return;
    }

    // Determine model based on whether image is uploaded
    const hasImage = !!uploadedImage;
    const model = hasImage ? "kling-1-6" : "kling-1-6-text-to-video";

    let imageUrl = null;

    // Upload image first if exists
    if (hasImage && uploadedImage) {
      try {
        const formData = new FormData();
        formData.append("file", uploadedImage);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Image upload failed");
        }

        const uploadResult = await uploadResponse.json();
        if (uploadResult.code === 0) {
          imageUrl = uploadResult.data.url;
        } else {
          throw new Error(uploadResult.message || "Image upload failed");
        }
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error(
          "Image upload failed. Proceeding with text-to-video instead."
        );
        // Continue with text-to-video generation
      }
    }

    // Prepare generation parameters
    const generationParams = {
      model,
      prompt: description.trim(),
      duration,
      aspect_ratio: aspectRatio,
      ...(imageUrl && { image_url: imageUrl }),
    };

    console.log("Generation parameters:", generationParams);

    // Submit generation
    const result = await submitGeneration(generationParams);

    if (result) {
      // Start polling for status
      pollStatus(result.id);
    }
  };

  // Handle retry
  const handleRetry = () => {
    handleGenerate();
  };

  // Handle new generation
  const handleNewGeneration = () => {
    clearCurrentGeneration();
    setDescription("");
    setUploadedImage(null);
    setImagePreview(null);
  };

  return (
    <section id="video-generator" className="py-8 md:py-12">
      <div className="container px-4 md:px-6 max-w-6xl">
        {/* Main content card with dark theme */}
        <Card className="bg-gray-900/95 backdrop-blur-md border border-gray-700 shadow-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left: Image upload area */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-100">
                Reference Image (Optional)
              </Label>

              <div
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer group",
                  isDragOver
                    ? "border-blue-400 bg-blue-950/30"
                    : "border-gray-600 hover:border-gray-500",
                  uploadedImage ? "border-solid border-gray-600" : ""
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (!uploadedImage) {
                    document.getElementById("image-upload")?.click();
                  }
                }}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute top-2 right-2 p-1 bg-gray-800/80 rounded-full hover:bg-gray-800 transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-200" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 group-hover:text-gray-300 transition-colors" />
                    <p className="text-gray-200 font-medium mb-2">
                      Click to upload or drag image here
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports JPG, PNG, GIF formats, max 10MB
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Upload an image to enable image-to-video generation, or
                      leave empty for text-to-video
                    </p>
                  </div>
                )}

                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Right: Text description area */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-100">
                Video Description
              </Label>

              <div className="relative">
                <TextareaAutosize
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minRows={6}
                  maxRows={12}
                  placeholder={placeholder}
                  className="w-full p-4 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 bg-gray-800 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Video aspect ratio selection */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <Label className="text-lg font-semibold text-gray-100 mb-4 block">
              Video Aspect Ratio
            </Label>

            <RadioGroup
              value={aspectRatio}
              onValueChange={(value) =>
                setAspectRatio(value as VideoAspectRatio)
              }
              className="flex gap-8"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="16:9" id="landscape" />
                <Label
                  htmlFor="landscape"
                  className="text-gray-200 font-medium cursor-pointer flex items-center gap-2"
                >
                  <span className="w-8 h-5 bg-gray-600 rounded-sm"></span>
                  16:9 Landscape
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <RadioGroupItem value="9:16" id="portrait" />
                <Label
                  htmlFor="portrait"
                  className="text-gray-200 font-medium cursor-pointer flex items-center gap-2"
                >
                  <span className="w-5 h-8 bg-gray-600 rounded-sm"></span>
                  9:16 Portrait
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <RadioGroupItem value="1:1" id="square" />
                <Label
                  htmlFor="square"
                  className="text-gray-200 font-medium cursor-pointer flex items-center gap-2"
                >
                  <span className="w-6 h-6 bg-gray-600 rounded-sm"></span>
                  1:1 Square
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Video duration selection */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <Label className="text-lg font-semibold text-gray-100 mb-4 block">
              Video Duration
            </Label>
            <RadioGroup
              value={duration}
              onValueChange={(value) => setDuration(value as VideoDuration)}
              className="flex gap-8"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="5" id="duration-5s" />
                <Label
                  htmlFor="duration-5s"
                  className="text-gray-200 font-medium cursor-pointer"
                >
                  5 Seconds
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="10" id="duration-10s" />
                <Label
                  htmlFor="duration-10s"
                  className="text-gray-200 font-medium cursor-pointer"
                >
                  10 Seconds
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* TODO: Add CFG Scale slider/input here if needed in the future */}
          {/* <div className="mt-6 pt-6 border-t border-gray-700">
            <Label className="text-lg font-semibold text-gray-100 mb-4 block">
              Creative Freedom (CFG Scale)
            </Label>
             Input for CFG Scale 
          </div> */}

          {/* Generate button */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={!description.trim() || isLoading}
              size="lg"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5 mr-2" />
              {isLoading ? "Submitting..." : "Generate Video"}
            </Button>
          </div>
        </Card>

        {/* Video Result Display */}
        {currentGeneration && (
          <div className="mt-8">
            <VideoResult
              generation={currentGeneration}
              onRetry={handleRetry}
              onNewGeneration={handleNewGeneration}
            />
          </div>
        )}
      </div>
    </section>
  );
}
