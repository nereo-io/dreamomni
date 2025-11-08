/**
 * AgentJobDetail
 * Main detail view for an Agent job with tabs for shots, logs, and assets
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AgentJob, AgentAsset } from '@/types/agent';
import { AgentJobHeader } from './AgentJobHeader';
import { AgentShotList } from './AgentShotList';
import { AgentJobSkeleton } from './AgentJobSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import DeleteConfirmDialog from '@/components/blocks/image-history-for-generation/components/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';

const POLLING_INTERVAL = 5000; // 5 seconds

interface AgentJobDetailProps {
  jobId: string;
  locale: string;
}

export function AgentJobDetail({ jobId, locale }: AgentJobDetailProps) {
  const router = useRouter();
  const [job, setJob] = useState<AgentJob | null>(null);
  const [assets, setAssets] = useState<AgentAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shots');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch job details
  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/agent/jobs/${jobId}?include_shots=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }

      const data: AgentJob = await response.json();
      setJob(data);
    } catch (error: any) {
      console.error('Error fetching job:', error);
      toast.error(error.message || 'Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch(`/api/agent/jobs/${jobId}/assets`);

      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }

      const data = await response.json();
      setAssets(data.assets || []);
    } catch (error: any) {
      console.error('Error fetching assets:', error);
    }
  }, [jobId]);

  // Initial fetch
  useEffect(() => {
    fetchJob();
    fetchAssets();
  }, [fetchJob, fetchAssets]);

  // Polling for active jobs
  useEffect(() => {
    if (!job) return;

    const isActive = ['pending', 'splitting_shots', 'generating_keyframes', 'orchestrating_videos', 'splicing'].includes(
      job.status
    );

    if (!isActive) return;

    const interval = setInterval(() => {
      console.log('Polling job status...');
      fetchJob();
      fetchAssets();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [job, fetchJob, fetchAssets]);

  // Handle delete
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/agent/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      toast.success('Job deleted successfully');
      router.push(`/${locale}/agent`);
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Handle retry
  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      const response = await fetch(`/api/agent/jobs/${jobId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to retry job');
      }

      toast.success('Job retry initiated');
      fetchJob(); // Refresh job status
    } catch (error) {
      console.error('Error retrying job:', error);
      toast.error('Failed to retry job');
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle download final video
  const handleDownloadFinal = () => {
    if (job?.final_video_url) {
      const link = document.createElement('a');
      link.href = job.final_video_url;
      link.download = `agent_video_${jobId}.mp4`;
      link.click();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <AgentJobSkeleton variant="detail" />
      </div>
    );
  }

  // Error state
  if (!job) {
    return (
      <div className="p-6 text-center py-12">
        <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-200 mb-2">Job Not Found</h3>
        <p className="text-gray-400 mb-6">The requested Agent job could not be found</p>
        <Button onClick={() => router.push(`/${locale}/agent`)}>Back to Jobs</Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <AgentJobHeader
          job={job}
          onDelete={handleDelete}
          onRetry={job.status === 'failed' ? handleRetry : undefined}
          onDownloadFinal={job.final_video_url ? handleDownloadFinal : undefined}
          isDeleting={isDeleting}
          isRetrying={isRetrying}
        />

        {/* Tabs */}
        <Card className="bg-gray-800 border-gray-700 text-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-700 px-6 pt-4">
              <TabsList className="bg-transparent">
                <TabsTrigger value="shots" className="data-[state=active]:bg-gray-700">
                  Shots
                  {job.shots && <Badge className="ml-2">{job.shots.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-gray-700">
                  Logs
                  {job.logs && <Badge className="ml-2">{job.logs.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="assets" className="data-[state=active]:bg-gray-700">
                  Assets
                  <Badge className="ml-2">{assets.length}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-6">
              {/* Shots Tab */}
              <TabsContent value="shots" className="mt-0">
                <AgentShotList shots={job.shots || []} />
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="mt-0">
                {job.logs && job.logs.length > 0 ? (
                  <div className="space-y-2">
                    {job.logs.map((log, index) => (
                      <div
                        key={index}
                        className="bg-gray-700/50 rounded-lg p-3 flex items-start gap-3"
                      >
                        <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </span>
                        <p className="text-sm text-gray-200 flex-1">{log.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">No logs available</div>
                )}
              </TabsContent>

              {/* Assets Tab */}
              <TabsContent value="assets" className="mt-0">
                {assets.length > 0 ? (
                  <div className="space-y-3">
                    {assets.map(asset => (
                      <div
                        key={asset.id}
                        className="bg-gray-700/50 rounded-lg p-4 flex items-start justify-between gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{asset.asset_type}</Badge>
                            <Badge
                              variant={
                                asset.status === 'done'
                                  ? 'default'
                                  : asset.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {asset.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                          </p>
                          {asset.content && asset.asset_type === 'script' && (
                            <details className="mt-2">
                              <summary className="text-sm text-gray-300 cursor-pointer hover:text-gray-100">
                                View Script
                              </summary>
                              <pre className="mt-2 text-xs text-gray-400 bg-gray-800 rounded p-3 overflow-auto max-h-64">
                                {asset.content}
                              </pre>
                            </details>
                          )}
                        </div>
                        {asset.url && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(asset.url, '_blank')}
                              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = asset.url!;
                                link.download = `asset_${asset.asset_type}_${asset.id}`;
                                link.click();
                              }}
                              className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">No assets available</div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Delete Agent Job?"
        description={`Are you sure you want to delete "${job.prompt.substring(0, 50)}..."? This action cannot be undone and will delete all associated shots and assets.`}
      />
    </>
  );
}
