/**
 * AgentJobsList
 * Right panel displaying user's Agent jobs
 * References: video-history/index.tsx for structure and polling logic
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentJob, AgentJobListResponse } from '@/types/agent';
import { AgentJobItem } from './AgentJobItem';
import { AgentJobSkeleton } from './AgentJobSkeleton';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const POLLING_INTERVAL = 5000; // 5 seconds
const JOB_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ITEMS_PER_PAGE = 8;

interface AgentJobsListProps {
  refreshTrigger?: number;
  locale: string;
  onReEdit?: (job: AgentJob) => void;
}

export function AgentJobsList({ refreshTrigger, locale, onReEdit }: AgentJobsListProps) {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Use ref to track latest jobs without causing re-renders
  const jobsRef = useRef<AgentJob[]>([]);

  // Update ref whenever jobs change
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  // Fetch jobs from API
  const fetchJobs = useCallback(async (page = 1, showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsPageLoading(true);
    }
    try {
      const response = await fetch(`/api/agent/jobs?page=${page}&page_size=${ITEMS_PER_PAGE}&include_shots=true`);

      if (!response.ok) {
        if (response.status === 401) {
          setIsUnauthorized(true);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch Agent jobs');
      }

      const data: AgentJobListResponse | { jobs: AgentJob[] } = await response.json();
      const total = 'total' in data ? data.total : data.jobs.length;
      const pageSize = 'page_size' in data ? data.page_size : ITEMS_PER_PAGE;
      const pageFromResponse = 'page' in data ? data.page : page;
      setJobs(data.jobs);
      setCurrentPage(pageFromResponse);
      setTotalItems(total);
      setTotalPages(Math.max(1, Math.ceil(total / pageSize || 1)));
      setIsLoading(false);
      setIsPageLoading(false);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error(error.message || 'Failed to load Agent jobs');
      setIsLoading(false);
      setIsPageLoading(false);
    }
  }, []);

  // Background polling for active jobs
  const updateActiveJobsInBackground = useCallback(async () => {
    const terminalStatuses: AgentJob['status'][] = ['completed', 'failed'];
    // Filter active jobs, skip those older than 30 minutes
    const activeJobs = jobsRef.current.filter(job => {
      if (terminalStatuses.includes(job.status)) {
        return false;
      }

      // Skip polling for jobs older than 30 minutes
      const createdAt = new Date(job.created_at).getTime();
      const now = Date.now();
      if (now - createdAt > JOB_TIMEOUT_MS) {
        return false;
      }

      return true;
    });

    if (activeJobs.length === 0) {
      return;
    }

    console.log(`Polling ${activeJobs.length} active jobs...`);

    try {
      const response = await fetch(`/api/agent/jobs?page=${currentPage}&page_size=${ITEMS_PER_PAGE}&include_shots=true`);

      if (response.ok) {
        const data: AgentJobListResponse | { jobs: AgentJob[] } = await response.json();
        setJobs(data.jobs);
        if ('total' in data && 'page_size' in data) {
          setTotalItems(data.total);
          setTotalPages(Math.max(1, Math.ceil(data.total / (data.page_size || ITEMS_PER_PAGE))));
        }
        console.log('Job statuses refreshed');
      }
    } catch (error) {
      console.error('Failed to poll job statuses:', error);
    }
  }, [currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Refresh when trigger changes (from parent component)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchJobs();
    }
  }, [refreshTrigger, fetchJobs]);

  // Set up polling interval for active jobs
  useEffect(() => {
    const interval = setInterval(() => {
      updateActiveJobsInBackground();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [updateActiveJobsInBackground]);

  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    fetchJobs(page, false);
  }, [currentPage, fetchJobs]);

  // Handle delete job
  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/agent/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Remove from local state
      setJobs(prevJobs => prevJobs.filter(j => j.id !== jobId));
      toast.success('Agent job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  // Unauthorized state (not logged in)
  if (isUnauthorized) {
    return (
      <div className="flex-1 bg-gray-900 rounded-xl shadow-lg flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-yellow-400 mb-4" />
          <h3 className="text-2xl font-semibold text-gray-200 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-400">
            Please log in to view your Agent jobs
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex-1 bg-gray-900 rounded-xl shadow-lg overflow-y-auto p-6">
        <div className="space-y-4">
          <AgentJobSkeleton variant="card" count={3} />
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && jobs.length === 0) {
    return (
      <div className="flex-1 bg-gray-900 rounded-xl shadow-lg flex items-center justify-center p-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-2xl font-semibold text-gray-200 mb-2">
            No Agent Jobs Yet
          </h3>
          <p className="text-gray-400">
            Create your first intelligent video orchestration job to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col lg:h-full">
      {/* Header */}
      <header className="py-3 px-4 md:px-5 flex justify-between items-center border-b border-gray-700">
        <div className="text-lg md:text-xl font-semibold flex items-center text-white min-w-0">
          <Sparkles className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 flex-shrink-0" />
          <span className="truncate">Agent Jobs ({totalItems || jobs.length})</span>
        </div>
      </header>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 lg:dark-scrollbar relative">
        {isPageLoading && (
          <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-10">
            <AgentJobSkeleton variant="card" count={2} />
          </div>
        )}
        <div className="space-y-4">
          {jobs.map(job => (
            <AgentJobItem
              key={job.id}
              job={job}
              onDelete={handleDeleteJob}
              onReEdit={onReEdit}
              locale={locale}
            />
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="border-t border-gray-700 bg-gray-900">
          <Pagination className="py-3">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
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
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) handlePageChange(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
