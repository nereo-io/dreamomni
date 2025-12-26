"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Loader2, PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAppContext } from "@/contexts/app";
import { AgentJob, AgentJobListResponse } from "@/types/agent";
import VideoHistorySkeleton from "./VideoHistorySkeleton";

const ITEMS_PER_PAGE = 12;

export default function JobsTab() {
  const t = useTranslations("video-history");
  const { user, setShowSignModal } = useAppContext();
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const jobsWithFinal = useMemo(
    () => jobs.filter((job) => job.final_video_url),
    [jobs]
  );

  const fetchJobs = useCallback(
    async (page = 1, showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsPageLoading(true);
      }

      if (!user?.uuid) {
        setJobs([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(0);
        setIsLoading(false);
        setIsPageLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/agent/jobs?page=${page}&page_size=${ITEMS_PER_PAGE}&include_shots=true`
        );

        if (!response.ok) {
          throw new Error(t("toast.fetchError"));
        }

        const data: AgentJobListResponse | { jobs: AgentJob[]; total?: number; page?: number; page_size?: number; total_pages?: number } =
          await response.json();

        const jobsData = data.jobs || [];
        const total =
          typeof (data as any).total === "number"
            ? (data as any).total
            : jobsData.length;
        const pageSize =
          typeof (data as any).page_size === "number"
            ? (data as any).page_size
            : ITEMS_PER_PAGE;
        const totalPagesFromResponse =
          typeof (data as any).total_pages === "number"
            ? (data as any).total_pages
            : Math.max(1, Math.ceil((total || 0) / (pageSize || ITEMS_PER_PAGE)));
        const pageFromResponse =
          typeof (data as any).page === "number" ? (data as any).page : page;

        setJobs(jobsData);
        setCurrentPage(pageFromResponse);
        setTotalItems(total);
        setTotalPages(totalPagesFromResponse);
      } catch (error: any) {
        console.error("Failed to fetch jobs:", error);
        toast.error(error?.message || t("toast.fetchError"));
      } finally {
        setIsLoading(false);
        setIsPageLoading(false);
      }
    },
    [t, user?.uuid]
  );

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    fetchJobs(page, false);
  };

  const createProxyDownloadUrl = (sourceUrl: string, filename: string) =>
    `/api/proxy-video?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(
      filename
    )}`;

  const triggerDownload = (
    href: string,
    filename: string,
    openInNewTab = false
  ) => {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    link.rel = "noopener noreferrer";
    link.style.display = "none";
    link.target = openInNewTab ? "_blank" : "_self";

    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      document.body.removeChild(link);
    }
  };

  const handlePlay = (job: AgentJob) => {
    if (!job.final_video_url) {
      toast.info(t("toast.videoNotAvailable"));
      return;
    }
    window.open(job.final_video_url, "_blank");
  };

  const handleDownload = async (job: AgentJob) => {
    if (!job.final_video_url) {
      toast.error(t("toast.downloadNotAvailable"));
      return;
    }

    const filename = `agent_job_${job.id}.mp4`;
    const proxyUrl = createProxyDownloadUrl(job.final_video_url, filename);

    setDownloadingId(job.id);
    const minimumSpinnerDelay = new Promise((resolve) =>
      setTimeout(resolve, 1200)
    );

    try {
      triggerDownload(proxyUrl, filename);
    } catch (err) {
      console.error("Proxy download failed, falling back to original URL:", err);
      triggerDownload(job.final_video_url, filename, true);
    } finally {
      await minimumSpinnerDelay;
      setDownloadingId((current) => (current === job.id ? null : current));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <div className="bg-gray-900 rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            <VideoHistorySkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!user?.uuid) {
    return (
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <div className="bg-gray-900 rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            <div className="p-4 md:p-6 text-center py-12">
              <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-200 mb-2">
                {t("pleaseSignIn")}
              </h3>
              <p className="text-gray-400 mb-6">{t("signInToViewVideos")}</p>
              <Button
                onClick={() => setShowSignModal(true)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t("signInButton")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!jobsWithFinal.length) {
    return (
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <div className="bg-gray-900 rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
          <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
            <div className="p-4 md:p-6 text-center py-12">
              <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-200 mb-2">
                {t("noVideosTitle")}
              </h3>
              <p className="text-gray-400 mb-6">{t("noVideosDescription")}</p>
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <a href="/image-to-video">{t("generateVideoButton")}</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2 h-full">
      <div className="bg-gray-900 rounded-xl shadow-lg flex flex-col w-full lg:overflow-hidden lg:h-full ">
        <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar relative">
          {isPageLoading && (
            <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-10">
              <VideoHistorySkeleton />
            </div>
          )}
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {jobsWithFinal.map((job) => (
                <Card
                  key={job.id}
                  className="bg-gray-700/50 border-gray-700 text-gray-200 flex flex-col hover:bg-gray-700/70 transition-all duration-200"
                >
                  <CardHeader>
                    <div className="aspect-video bg-gray-700 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                      {job.final_video_url ? (
                        <video
                          src={job.final_video_url}
                          poster={job.reference_image_urls?.[0]}
                          className="w-full h-full object-cover"
                          preload="auto"
                          controls={false}
                        />
                      ) : (
                        <PlayCircle className="h-16 w-16 text-gray-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow" />
                  <CardFooter className="flex justify-between gap-2 pt-4 border-t border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlay(job)}
                      disabled={!job.final_video_url}
                      className="flex-1 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      {t("playButton")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(job)}
                      disabled={!job.final_video_url || downloadingId === job.id}
                      className="flex-1 border border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingId === job.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2 text-gray-200" />
                      )}
                      {t("downloadButton")}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
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
                  {(() => {
                    const pageNumbers = [];
                    const maxVisiblePages = 5;

                    if (totalPages <= maxVisiblePages) {
                      for (let i = 1; i <= totalPages; i++) {
                        pageNumbers.push(i);
                      }
                    } else {
                      const startPage = Math.max(1, currentPage - 2);
                      const endPage = Math.min(totalPages, currentPage + 2);

                      for (let i = startPage; i <= endPage; i++) {
                        pageNumbers.push(i);
                      }
                    }

                    return pageNumbers.map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ));
                  })()}
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
      </div>
    </div>
  );
}
