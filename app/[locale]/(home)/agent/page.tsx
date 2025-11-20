/**
 * Agent Page
 * Unified page with left-right layout for creating and viewing Agent jobs
 * References: ai-video-generation-tool for layout structure
 */

"use client";

import { useState } from 'react';
import { AgentCreatePanel } from '@/components/blocks/agent/AgentCreatePanel';
import { AgentJobsList } from '@/components/blocks/agent/AgentJobsList';
import { AgentJob } from '@/types/agent';

export default function AgentPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [reEditData, setReEditData] = useState<{
    prompt: string;
    referenceImageUrl?: string;
    durationSeconds?: number;
    imageModel?: string;
    videoModel?: string;
  } | null>(null);

  const handleJobCreated = () => {
    // Trigger refresh of jobs list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleReEdit = (job: AgentJob) => {
    // Extract data from job and pass to create panel
    setReEditData({
      prompt: job.prompt,
      referenceImageUrl: job.reference_image_url || undefined,
      durationSeconds: job.duration_seconds,
      imageModel: job.image_model,
      videoModel: job.video_model,
    });
  };

  return (
    <div className="w-full mb-6 sm:mb-8 lg:mb-10 lg:h-[calc(100vh-90px)]">
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        {/* Left Panel: Create Form */}
        <AgentCreatePanel onJobCreated={handleJobCreated} initialData={reEditData || undefined} />

        {/* Right Panel: Jobs List */}
        <AgentJobsList refreshTrigger={refreshTrigger} locale={locale} onReEdit={handleReEdit} />
      </div>
    </div>
  );
}
