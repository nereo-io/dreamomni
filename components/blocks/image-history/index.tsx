"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildPaginationItems } from "@/utils/pagination";
import { getImageModel } from "@/config/image-models";
import ImageHistorySkeleton from "./ImageHistorySkeleton";
import PromptSearchBar from '@/components/blocks/my-creations-page/PromptSearchBar';

export interface ImageGenerationResult {
  id: string;
  prompt: string;
  optimized_prompt?: string;
  image_url?: string;
  image_url_r2?: string;
  image_urls?: string[];
  image_urls_r2?: string[];
  input_image_urls?: string[];
  status:
    | "pending"
    | "completed"
    | "failed"
    | "in_progress"
    | "in_queue"
    | "prompt_optimizing"
    | "saved_to_r2";
  model: string;
  quality: string;
  style?: string;
  image_size?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
  credits_used: number;
  error_message?: string;
  is_agent_mode?: boolean;
  agent_image_count?: number;
  expanded_prompts?: string[];
  metadata?: {
    agent_tasks?: Array<{
      taskId: string;
      status: "completed" | "failed" | "pending";
      imageUrl?: string;
      r2Url?: string;
      completedAt?: string;
      error?: string;
    }>;
    [key: string]: unknown;
  };
}

interface ImageHistoryProps {
  refreshTrigger: number;
  userId?: string;
  newImage?: ImageGenerationResult;
  filterMode?: "text-to-image" | "image-to-image" | "all";
  className?: string;
  showEmptyState?: boolean;
}

const ITEMS_PER_PAGE = 50;
const MAX_VISIBLE_PAGES = 10;
const getCacheKey = (page: number, query: string) => `${page}|${query}`;

const getImageDisplayUrl = (image: ImageGenerationResult) =>
  image.image_url_r2 ||
  image.image_url ||
  image.image_urls_r2?.[0] ||
  image.image_urls?.[0] ||
  "";

const getOutputImages = (image: ImageGenerationResult) =>
  image.image_urls_r2?.length
    ? image.image_urls_r2
    : image.image_urls?.length
    ? image.image_urls
    : image.image_url
    ? [image.image_url]
    : [];

export default function ImageHistory({
  refreshTrigger,
  userId,
  newImage,
  filterMode = "all",
  className,
  showEmptyState = false,
}: ImageHistoryProps) {
  const t = useTranslations("imageHistory");
  const [images, setImages] = useState<ImageGenerationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalItems] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageGenerationResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVersion, setSearchVersion] = useState(0);
  const normalizedQuery = searchQuery.trim();
  const hasSearch = normalizedQuery.length > 0;
  const pageCacheRef = useRef<
    Map<
      string,
      {
        images: ImageGenerationResult[];
        page: number;
        totalPages: number;
        totalItems: number;
      }
    >
  >(new Map());

  const buildHistoryUrl = useCallback((page: number, query: string) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(ITEMS_PER_PAGE),
    });
    if (query) {
      params.set('search', query);
    }
    return `/api/image-generations/history?${params.toString()}`;
  }, []);

  const applyPageData = useCallback((data: {
    images: ImageGenerationResult[];
    page: number;
    totalPages: number;
    totalItems: number;
  }) => {
    setImages(data.images);
    setCurrentPage(data.page);
    setTotalPages(data.totalPages);
    setTotalItems(data.totalItems);
  }, []);

  const prefetchPage = useCallback(
    async (page: number, maxPage: number, query: string) => {
      if (!userId || page < 1 || page > maxPage) {
        return;
      }

      const cacheKey = getCacheKey(page, query);
      if (pageCacheRef.current.has(cacheKey)) {
        return;
      }

      try {
        const response = await fetch(buildHistoryUrl(page, query), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data.code === 0 && data.data) {
          const imageData = Array.isArray(data.data.data) ? data.data.data : [];
          const pagination = data.data.pagination || {};

          let filteredData = imageData;
          if (filterMode !== "all") {
            filteredData = imageData.filter((img: ImageGenerationResult) => {
              if (filterMode === "text-to-image") {
                return img.model === "google/nano-banana";
              }
              if (filterMode === "image-to-image") {
                return img.model === "nano-banana-edit";
              }
              return true;
            });
          }

          const pageValue = pagination.page || page;
          const totalPagesValue = pagination.totalPages || maxPage || 1;
          const totalValue = pagination.total || filteredData.length;

          pageCacheRef.current.set(getCacheKey(pageValue, query), {
            images: filteredData,
            page: pageValue,
            totalPages: totalPagesValue,
            totalItems: totalValue,
          });
        }
      } catch (error) {
        console.warn("Prefetch image history failed:", error);
      }
    },
    [buildHistoryUrl, filterMode, userId]
  );

  const fetchHistory = useCallback(
    async (page: number = 1, showLoading = true, query: string) => {
      if (!userId) {
        setImages([]);
        setLoading(false);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(0);
        pageCacheRef.current.clear();
        return;
      }

      const cacheKey = getCacheKey(page, query);
      const cached = pageCacheRef.current.get(cacheKey);
      if (cached) {
        applyPageData(cached);
        setLoading(false);
        setIsPageLoading(false);
        prefetchPage(page - 1, cached.totalPages, query);
        prefetchPage(page + 1, cached.totalPages, query);
        return;
      }

      if (showLoading) {
        setLoading(true);
      } else {
        setIsPageLoading(true);
      }

      try {
        const response = await fetch(buildHistoryUrl(page, query), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.code === 0 && data.data) {
            const imageData = Array.isArray(data.data.data) ? data.data.data : [];
            const pagination = data.data.pagination || {};

            let filteredData = imageData;
            if (filterMode !== "all") {
              filteredData = imageData.filter((img: ImageGenerationResult) => {
                if (filterMode === "text-to-image") {
                  return img.model === "google/nano-banana";
                }
                if (filterMode === "image-to-image") {
                  return img.model === "nano-banana-edit";
                }
                return true;
              });
            }

            const pageValue = pagination.page || page;
            const totalPagesValue = pagination.totalPages || 1;
            const totalValue = pagination.total || filteredData.length;

            const cacheEntry = {
              images: filteredData,
              page: pageValue,
              totalPages: totalPagesValue,
              totalItems: totalValue,
            };

            pageCacheRef.current.set(getCacheKey(pageValue, query), cacheEntry);
            applyPageData(cacheEntry);
            prefetchPage(pageValue - 1, totalPagesValue, query);
            prefetchPage(pageValue + 1, totalPagesValue, query);
          } else {
            setImages([]);
          }
        } else {
          console.error("Failed to fetch image history:", response.statusText);
          setImages([]);
        }
      } catch (error) {
        console.error("Error fetching image history:", error);
        setImages([]);
      } finally {
        setLoading(false);
        setIsPageLoading(false);
      }
    },
    [applyPageData, buildHistoryUrl, filterMode, prefetchPage, userId]
  );

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value.trim());
    setSearchVersion((prev) => prev + 1);
  }, []);

  useEffect(() => {
    pageCacheRef.current.clear();
    setCurrentPage(1);
    fetchHistory(1, true, normalizedQuery);
  }, [fetchHistory, normalizedQuery, refreshTrigger, searchVersion, userId]);

  useEffect(() => {
    if (!newImage || !newImage.id || hasSearch) {
      return;
    }

    setImages((prevImages) => {
      const existingIndex = prevImages.findIndex((img) => img.id === newImage.id);
      if (existingIndex !== -1) {
        const updatedImages = [...prevImages];
        updatedImages[existingIndex] = newImage;
        return updatedImages;
      }
      const nextImages = [newImage, ...prevImages];
      return nextImages.slice(0, ITEMS_PER_PAGE);
    });

    setTotalItems((prev) => prev + 1);

    if (currentPage === 1) {
      const cacheKey = getCacheKey(1, normalizedQuery);
      const cached = pageCacheRef.current.get(cacheKey);
      if (cached) {
        const updatedImages = [newImage, ...cached.images].slice(0, ITEMS_PER_PAGE);
        pageCacheRef.current.set(cacheKey, {
          ...cached,
          images: updatedImages,
          totalItems: cached.totalItems + 1,
        });
      }
    }
  }, [currentPage, hasSearch, newImage, normalizedQuery]);

  useEffect(() => {
    if (!isDetailOpen || !selectedImage || images.length === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
      }

      if (event.defaultPrevented) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      const currentIndex = images.findIndex((item) => item.id === selectedImage.id);
      if (currentIndex === -1) {
        return;
      }

      const delta = event.key === "ArrowUp" ? -1 : 1;
      const nextIndex = currentIndex + delta;
      if (nextIndex < 0 || nextIndex >= images.length) {
        return;
      }

      event.preventDefault();
      setSelectedImage(images[nextIndex]);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images, isDetailOpen, selectedImage]);

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchHistory(newPage, false, normalizedQuery);
  };

  const createProxyDownloadUrl = (sourceUrl: string, filename: string) =>
    `/api/proxy-image?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(filename)}`;

  const triggerDownload = (href: string, filename: string) => {
    const downloadLink = document.createElement("a");
    downloadLink.href = href;
    downloadLink.download = filename;
    downloadLink.rel = "noopener noreferrer";
    downloadLink.style.cssText =
      "display: none; position: absolute; top: -9999px; left: -9999px;";

    document.body.appendChild(downloadLink);

    try {
      downloadLink.click();
    } finally {
      document.body.removeChild(downloadLink);
    }
  };

  const downloadImage = async (
    imageId: string,
    imageUrl: string,
    prompt: string
  ) => {
    if (!imageUrl) {
      toast.error("Image not available for download");
      return;
    }

    const safePrompt = prompt
      .substring(0, 20)
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "_");
    const urlParts = imageUrl.split(".");
    const extension = urlParts[urlParts.length - 1]?.split("?")[0]?.toLowerCase() || "png";
    const filename = `${safePrompt}_${imageId}.${extension}`;

    const proxyUrl = createProxyDownloadUrl(imageUrl, filename);

    setDownloadingId(imageId);
    const minimumSpinnerDelay = new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error("Empty image blob");
      }

      const objectUrl = window.URL.createObjectURL(blob);
      triggerDownload(objectUrl, filename);
      window.URL.revokeObjectURL(objectUrl);

      toast.success(t("imageDownloaded"));
    } catch (error) {
      console.error("Proxy download failed, trying fallback:", error);
      try {
        triggerDownload(proxyUrl, filename);
      } catch (fallbackError) {
        console.error("Fallback download failed:", fallbackError);
        triggerDownload(imageUrl, filename);
      }
    } finally {
      await minimumSpinnerDelay;
      setDownloadingId((current) => (current === imageId ? null : current));
    }
  };

  const openImage = (imageUrl: string) => {
    window.open(imageUrl, "_blank", "noopener,noreferrer");
  };

  const deleteImage = async (imageId: string, prompt: string) => {
    if (!confirm(`Are you sure you want to delete this image?\n\nPrompt: ${prompt.slice(0, 100)}...`)) {
      return;
    }

    try {
      const response = await fetch("/api/image-generations/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response JSON:", parseError);
        throw new Error("Invalid response format from server");
      }

      if (response.ok && result.code === 0) {
        setImages((prevImages) => prevImages.filter((img) => img.id !== imageId));
        setTotalItems((prev) => Math.max(0, prev - 1));
        pageCacheRef.current.forEach((entry, key) => {
          const nextImages = entry.images.filter((img) => img.id !== imageId);
          if (nextImages.length !== entry.images.length) {
            pageCacheRef.current.set(key, {
              ...entry,
              images: nextImages,
              totalItems: Math.max(0, entry.totalItems - 1),
            });
          }
        });
        toast.success(t("imageDeleted"));
        setIsDetailOpen(false);
      } else {
        throw new Error(result.message || `Delete failed: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("deleteFailed"));
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    switch (normalizedStatus) {
      case "completed":
      case "saved_to_r2":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
            {t("completed")}
          </Badge>
        );
      case "prompt_optimizing":
        return (
          <Badge className="bg-purple-500/20 text-purple-200 border border-purple-400/40">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            {t("optimizingPrompt")}
          </Badge>
        );
      case "in_progress":
      case "in_queue":
      case "pending":
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            {t("processing")}
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">{t("failed")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const paginationItems = buildPaginationItems(
    currentPage,
    totalPages,
    MAX_VISIBLE_PAGES
  );
  const matchesLabel = hasSearch ? t('searchMatches', { count: images.length }) : '';

  return (
    <div
      className={
        className ||
        "bg-gray-900 rounded-xl shadow-lg flex flex-col flex-1 w-full lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]"
      }
    >
      <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar relative">
        {loading ? (
          <ImageHistorySkeleton />
        ) : images.length === 0 && !hasSearch ? (
          showEmptyState ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="w-full h-full"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {!userId ? t("pleaseSignIn") : t("noImagesTitle")}
                </h3>
                <p className="text-gray-400">
                  {!userId ? t("signInToView") : t("noImagesDescription")}
                </p>
              </div>
            </div>
          ) : null
        ) : (
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            {isPageLoading && (
              <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-10">
                <ImageHistorySkeleton />
              </div>
            )}
            <div className="p-4 md:p-6">
              <PromptSearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSearch={handleSearch}
                placeholder={t('searchPromptPlaceholder')}
                buttonLabel={t('searchButton')}
                matchesLabel={matchesLabel}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-8 md:mt-10">
                {images.length === 0 ? (
                  hasSearch ? (
                    <div className="col-span-full rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 p-8 text-center text-sm text-gray-400">
                      {t('searchNoResults')}
                    </div>
                  ) : null
                ) : (
                  images.map((image) => (
                    <ImageMediaCard
                      key={image.id}
                      image={image}
                      downloadingId={downloadingId}
                      t={t}
                      onOpen={(item) => {
                        setSelectedImage(item);
                        setIsDetailOpen(true);
                      }}
                      onDownload={downloadImage}
                      onDelete={deleteImage}
                    />
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) handlePageChange(currentPage - 1);
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>
                    {paginationItems.map((item, index) =>
                      item === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(item);
                            }}
                            isActive={currentPage === item}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            handlePageChange(currentPage + 1);
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        )}
      </div>

      <ImageDetailModal
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setSelectedImage(null);
          }
        }}
        image={selectedImage}
        downloadingId={downloadingId}
        onDownload={downloadImage}
        onDelete={deleteImage}
        onOpenInNewTab={openImage}
        getStatusBadge={getStatusBadge}
        t={t}
      />
    </div>
  );
}

interface ImageMediaCardProps {
  image: ImageGenerationResult;
  downloadingId: string | null;
  t: (key: string) => string;
  onOpen: (image: ImageGenerationResult) => void;
  onDownload: (id: string, url: string, prompt: string) => void;
  onDelete: (id: string, prompt: string) => void;
}

function ImageMediaCard({
  image,
  downloadingId,
  t,
  onOpen,
  onDownload,
  onDelete,
}: ImageMediaCardProps) {
  const isMobile = useIsMobile();
  const [imageLoaded, setImageLoaded] = useState(false);
  const displayUrl = getImageDisplayUrl(image);
  const status = image.status.toLowerCase();
  const isReady = status === "completed" || status === "saved_to_r2";

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 shadow-sm transition-transform duration-200 hover:-translate-y-1"
      onClick={() => onOpen(image)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onOpen(image);
        }
      }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-800">
        {displayUrl && isReady ? (
          <>
            <img
              src={displayUrl}
              alt={image.prompt}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700/60">
                <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
              </div>
            )}
          </>
        ) : status === "failed" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-red-300">
            <XCircle className="h-8 w-8" />
            <span className="text-xs">Generation failed</span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">
              {status === "prompt_optimizing"
                ? t("optimizingPrompt")
                : status === "in_progress"
                ? t("generatingImage")
                : t("inQueue")}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute right-3 top-3 flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
                onDownload(image.id, displayUrl, image.prompt);
              }}
              disabled={!displayUrl || downloadingId === image.id}
              className={`h-9 w-9 bg-black/60 text-white hover:bg-black/80 ${
                isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              } transition-opacity`}
            >
              {downloadingId === image.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(image.id, image.prompt);
              }}
              className={`h-9 w-9 bg-black/60 text-white hover:bg-red-500/80 ${
                isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              } transition-opacity`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
      </div>
    </div>
  );
}

interface ImageDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: ImageGenerationResult | null;
  downloadingId: string | null;
  onDownload: (id: string, url: string, prompt: string) => void;
  onDelete: (id: string, prompt: string) => void;
  onOpenInNewTab: (url: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
  t: (key: string) => string;
}

function ImageDetailModal({
  open,
  onOpenChange,
  image,
  downloadingId,
  onDownload,
  onDelete,
  onOpenInNewTab,
  getStatusBadge,
  t,
}: ImageDetailModalProps) {
  const isMobile = useIsMobile();
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  useEffect(() => {
    setIsPromptExpanded(false);
  }, [image?.id]);

  if (!image) {
    return null;
  }

  const displayUrl = getImageDisplayUrl(image);
  const outputImages = getOutputImages(image);
  const inputImages = image.input_image_urls || [];

  const detailBody = (
    <div className="grid h-full grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="relative flex items-center justify-center bg-black/80">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={image.prompt}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <ImageIcon className="h-16 w-16" />
          </div>
        )}
      </div>
      <div className="flex h-full flex-col border-t border-gray-800 md:border-t-0 md:border-l">
        <ScrollArea className="flex-1">
          <div className="space-y-5 p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-100">Image details</div>
              {image.is_agent_mode && (
                <Badge className="bg-orange-500/20 text-orange-200 border border-orange-400/40">
                  Agent ({image.agent_image_count || outputImages.length})
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-gray-400">
                Prompt
              </div>
              <p
                className={`text-sm text-gray-100 ${
                  isPromptExpanded ? "" : "line-clamp-3"
                }`}
              >
                {image.prompt}
              </p>
              {image.prompt && image.prompt.length > 120 && (
                <button
                  type="button"
                  onClick={() => setIsPromptExpanded((prev) => !prev)}
                  className="text-xs font-medium text-blue-300 hover:text-blue-200"
                >
                  {isPromptExpanded ? "Collapse" : "Expand"}
                </button>
              )}
            </div>

            <div className="space-y-3">
              <DetailRow label="Status" value={getStatusBadge(image.status)} />
              <DetailRow
                label="Model"
                value={getImageModel(image.model)?.displayName || image.model}
              />
              <DetailRow label="Aspect ratio" value={image.image_size || "-"} />
              <DetailRow label="Resolution" value={image.resolution || "-"} />
              <DetailRow label={t("credits")} value={image.credits_used} />
              <DetailRow
                label="Created"
                value={formatDistanceToNow(new Date(image.created_at), {
                  addSuffix: true,
                })}
              />
            </div>

            {inputImages.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-gray-400">
                  Input images
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {inputImages.slice(0, 4).map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-800 bg-black/50"
                    >
                      <img
                        src={imageUrl}
                        alt={`Input ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {outputImages.length > 1 && (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-gray-400">
                  Outputs
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {outputImages.slice(0, 4).map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => onOpenInNewTab(imageUrl)}
                      className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-800 bg-black/50"
                    >
                      <img
                        src={imageUrl}
                        alt={`Output ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {image.error_message && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                {image.error_message}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-5 md:p-6 border-t border-gray-800 bg-gray-900/30">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => displayUrl && onOpenInNewTab(displayUrl)}
              disabled={!displayUrl}
              className="w-full bg-gray-800/80 text-gray-100 hover:bg-gray-700"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </Button>
            <Button
              variant="secondary"
              onClick={() => displayUrl && onDownload(image.id, displayUrl, image.prompt)}
              disabled={!displayUrl || downloadingId === image.id}
              className="w-full bg-gray-800/80 text-gray-100 hover:bg-gray-700"
            >
              {downloadingId === image.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>
            <Button
              variant="secondary"
              onClick={() => onDelete(image.id, image.prompt)}
              className="w-full bg-red-500/20 text-red-100 hover:bg-red-500/40"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(image.prompt);
                toast.success(t("promptCopied"));
              }}
              className="w-full border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex h-[95vh] flex-col bg-gray-950 text-gray-100 border-gray-800">
          <div className="flex items-center justify-between px-4 pt-2">
            <DrawerTitle className="text-sm font-semibold">Image details</DrawerTitle>
            <DrawerClose asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>
          <div className="mt-3 flex-1 overflow-hidden">{detailBody}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[1400px] h-[85vh] p-0 overflow-hidden bg-gray-950 text-gray-100 border-gray-800 flex flex-col">
        {detailBody}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm text-gray-200">
      <span className="text-gray-400">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
