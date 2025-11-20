/**
 * AgentJobsList
 * Right panel displaying user's Agent jobs
 * References: video-history/index.tsx for structure and polling logic
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentJob } from '@/types/agent';
import { AgentJobItem } from './AgentJobItem';
import { AgentJobSkeleton } from './AgentJobSkeleton';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const POLLING_INTERVAL = 5000; // 5 seconds
const JOB_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AgentJobsListProps {
  refreshTrigger?: number;
  locale: string;
}

export function AgentJobsList({ refreshTrigger, locale }: AgentJobsListProps) {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Use ref to track latest jobs without causing re-renders
  const jobsRef = useRef<AgentJob[]>([]);

  // Update ref whenever jobs change
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/agent/jobs?page=1&page_size=20&include_shots=true');

      if (!response.ok) {
        if (response.status === 401) {
          setIsUnauthorized(true);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch Agent jobs');
      }

      const data = await response.json();
      setJobs(data.jobs);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error(error.message || 'Failed to load Agent jobs');
      setIsLoading(false);
    }
  }, []);

  // Background polling for active jobs
  const updateActiveJobsInBackground = useCallback(async () => {
    const activeStatuses = [
      'pending',
      'splitting_shots',
      'generating_keyframes',
      'orchestrating_videos',
      'generating_videos',
      'splicing',
    ];

    // Filter active jobs, skip those older than 30 minutes
    const activeJobs = jobsRef.current.filter(job => {
      if (!activeStatuses.includes(job.status)) {
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
      const response = await fetch('/api/agent/jobs?page=1&page_size=20&include_shots=true');

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
        console.log('Job statuses refreshed');
      }
    } catch (error) {
      console.error('Failed to poll job statuses:', error);
    }
  }, []);

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
    <div className="flex-1 bg-gray-900 rounded-xl shadow-lg overflow-y-auto">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-100">Jobs</h2>
          <p className="text-gray-400 mt-1">
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} total
          </p>
        </div>

        {/* Job list */}
        <div className="space-y-4">
          {jobs.map(job => (
            <AgentJobItem
              key={job.id}
              job={job}
              onDelete={handleDeleteJob}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
