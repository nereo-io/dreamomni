/**
 * AgentJobList
 * List view component for Agent jobs with pagination and polling
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentJob, AgentJobListResponse } from '@/types/agent';
import { AgentJobCard } from './AgentJobCard';
import { AgentJobSkeleton } from './AgentJobSkeleton';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AlertTriangle, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import DeleteConfirmDialog from '@/components/blocks/image-history-for-generation/components/DeleteConfirmDialog';

const ITEMS_PER_PAGE = 12;
const POLLING_INTERVAL = 5000; // 5 seconds
const JOB_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AgentJobListProps {
  locale: string;
}

export function AgentJobList({ locale }: AgentJobListProps) {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<AgentJob | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Use ref to track latest jobs without causing re-renders
  const jobsRef = useRef<AgentJob[]>([]);

  // Update ref whenever jobs change
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  // Background polling for active jobs
  const updateActiveJobsInBackground = useCallback(async () => {
    const activeStatuses = [
      'pending',
      'splitting_shots',
      'generating_keyframes',
      'orchestrating_videos',
      'splicing',
    ];

    // Filter active jobs, skip those older than 30 minutes (optimization)
    const activeJobs = jobsRef.current.filter(job => {
      if (!activeStatuses.includes(job.status)) {
        return false;
      }

      // Skip polling for jobs older than 30 minutes to save resources
      // Backend will auto-mark them as failed when queried
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
      // Refresh job list to get latest status
      const response = await fetch(
        `/api/agent/jobs?page=${currentPage}&page_size=${ITEMS_PER_PAGE}`
      );

      if (response.ok) {
        const data: AgentJobListResponse = await response.json();
        setJobs(data.jobs);
        console.log('Job statuses refreshed');
      }
    } catch (error) {
      console.error('Failed to poll job statuses:', error);
    }
  }, [currentPage]);

  // Fetch jobs from API
  const fetchJobs = useCallback(async (page: number) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/agent/jobs?page=${page}&page_size=${ITEMS_PER_PAGE}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          setIsUnauthorized(true);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch Agent jobs');
      }

      const data: AgentJobListResponse = await response.json();

      setJobs(data.jobs);
      setCurrentPage(data.page);
      setTotalPages(Math.ceil(data.total / data.page_size));
      setTotalItems(data.total);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error(error.message || 'Failed to load Agent jobs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  // Set up polling interval for active jobs
  // Use a single interval that checks jobsRef.current on each tick
  useEffect(() => {
    const interval = setInterval(() => {
      updateActiveJobsInBackground();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [updateActiveJobsInBackground]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchJobs(newPage);
  };

  const handleDeleteJob = (job: AgentJob) => {
    setJobToDelete(job);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;

    setDeletingId(jobToDelete.id);

    try {
      const response = await fetch(`/api/agent/jobs/${jobToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Remove from local state
      setJobs(prevJobs => prevJobs.filter(j => j.id !== jobToDelete.id));
      toast.success('Agent job deleted successfully');

      // If current page is now empty and not page 1, go to previous page
      if (jobs.length === 1 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else if (jobs.length === 1) {
        // Refresh to show empty state
        fetchJobs(1);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setJobToDelete(null);
    }
  };

  // Unauthorized state (not logged in)
  if (isUnauthorized) {
    return (
      <div className="p-6 text-center py-12">
        <AlertTriangle className="mx-auto h-16 w-16 text-yellow-400 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-200 mb-2">
          Authentication Required
        </h3>
        <p className="text-gray-400 mb-6">
          Please log in to view your Agent jobs
        </p>
        <Button
          asChild
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Link href="/auth/signin">
            Sign In
          </Link>
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading && jobs.length === 0) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AgentJobSkeleton variant="card" count={8} />
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && jobs.length === 0) {
    return (
      <div className="p-6 text-center py-12">
        <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-200 mb-2">
          No Agent Jobs Yet
        </h3>
        <p className="text-gray-400 mb-6">
          Create your first intelligent video orchestration job to get started
        </p>
        <Button
          asChild
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Link href={`/${locale}/agent/create`}>
            <Plus className="h-5 w-5 mr-2" />
            Create Agent Job
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Agent Jobs</h2>
            <p className="text-gray-400 mt-1">
              {totalItems} {totalItems === 1 ? 'job' : 'jobs'} total
            </p>
          </div>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Link href={`/${locale}/agent/create`}>
              <Plus className="h-5 w-5 mr-2" />
              New Job
            </Link>
          </Button>
        </div>

        {/* Job grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {jobs.map(job => (
            <AgentJobCard
              key={job.id}
              job={job}
              onDelete={handleDeleteJob}
              isDeleting={deletingId === job.id}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <PaginationItem>
                            <span className="px-2">...</span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </div>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        isDeleting={deletingId !== null}
        title="Delete Agent Job?"
        description={
          jobToDelete
            ? `Are you sure you want to delete "${jobToDelete.prompt.substring(0, 50)}..."? This action cannot be undone.`
            : ''
        }
      />
    </>
  );
}
