"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImageItem {
  id: string;
  image_url?: string;  // API返回字段名
  image_url_r2?: string;  // R2存储的URL(如有)
  prompt?: string;
  created_at: string;
}

export interface SelectedImage {
  id: string;
  url: string;
}

interface ImageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (images: SelectedImage[]) => void;
  maxSelection: number;
  currentCount: number;
}

export function ImageSelectionModal({
  isOpen,
  onClose,
  onSelect,
  maxSelection,
  currentCount,
}: ImageSelectionModalProps) {
  const t = useTranslations("video-generator");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const remainingSlots = maxSelection - currentCount;

  // Fetch user generated images (only once per session)
  useEffect(() => {
    // Skip if modal is closed or data already fetched
    if (!isOpen || hasFetched) return;

    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/image-generations/history?limit=50&status=completed");
        const result = await response.json();

        if (result.code === 0) {
          // API返回格式: { code: 0, data: { data: [...], pagination: {...} } }
          setImages(result.data.data || []);
          setHasFetched(true); // Mark as fetched to prevent future requests
        }
      } catch (error) {
        console.error("Failed to fetch images:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [isOpen, hasFetched]);

  const toggleSelection = (image: ImageItem) => {
    const imageUrl = image.image_url_r2 || image.image_url;
    if (!imageUrl) return;

    setSelectedImages((prev) => {
      const existingIndex = prev.findIndex((img) => img.id === image.id);
      if (existingIndex !== -1) {
        // Remove if already selected
        return prev.filter((_, idx) => idx !== existingIndex);
      } else if (prev.length < remainingSlots) {
        // Add if within limit
        return [...prev, { id: image.id, url: imageUrl }];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    // Send analytics event
    if (typeof window !== "undefined" && (window as any).plausible) {
      (window as any).plausible("Image Selection", {
        props: {
          count: selectedImages.length,
          source: "my_creations",
        },
      });
    }

    onSelect(selectedImages);
    setSelectedImages([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-gray-900 border-gray-800 p-3 sm:p-6">
        <DialogHeader className="px-0">
          <DialogTitle className="text-white">{t("selectFromCreations")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-3 sm:mx-0 scrollbar-hide">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-400">{t("loadingImages")}</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-400">{t("noImagesYet")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4">
              {images.map((image) => {
                // 优先使用R2存储的URL,回退到原始URL
                const imageUrl = image.image_url_r2 || image.image_url;
                if (!imageUrl) return null;

                const isSelected = selectedImages.some((img) => img.id === image.id);
                const canSelect = selectedImages.length < remainingSlots;

                return (
                  <div
                    key={image.id}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? "ring-2 ring-blue-500"
                        : canSelect
                        ? "hover:ring-2 hover:ring-gray-400"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => (canSelect || isSelected) && toggleSelection(image)}
                  >
                    <Image
                      src={imageUrl}
                      alt={image.prompt || "Generated image"}
                      fill
                      sizes="(max-width: 768px) 33vw, 25vw"
                      className="object-cover"
                      loading="lazy"
                      quality={85}
                      unoptimized={false}
                    />
                    {isSelected && (
                      <>
                        <div className="absolute inset-0 bg-blue-500/20" />
                        <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1 shadow-lg">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 pt-3 sm:pt-4 px-0">
          <div className="text-xs sm:text-sm text-gray-400">
            {selectedImages.length > 0 && (
              <span>
                {selectedImages.length} selected · {remainingSlots - selectedImages.length} remaining
              </span>
            )}
            {selectedImages.length === 0 && (
              <>
                <span className="hidden sm:inline">Select up to {remainingSlots} images</span>
                <span className="sm:hidden">Select up to {remainingSlots}</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-sm border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedImages.length === 0}
              className="px-3 sm:px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add {selectedImages.length > 0 && `(${selectedImages.length})`}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
