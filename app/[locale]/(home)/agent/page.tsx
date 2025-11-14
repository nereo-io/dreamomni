/**
 * Agent Page
 * Unified page with left-right layout for creating and viewing Agent jobs
 * References: ai-video-generation-tool for layout structure
 */

"use client";

import { useState } from 'react';
import { AgentCreatePanel } from '@/components/blocks/agent/AgentCreatePanel';
import { AgentJobsList } from '@/components/blocks/agent/AgentJobsList';

export default function AgentPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleJobCreated = () => {
    // Trigger refresh of jobs list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full mb-6 sm:mb-8 lg:mb-10 lg:h-[calc(100vh-120px)]">
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        {/* Left Panel: Create Form */}
        <AgentCreatePanel onJobCreated={handleJobCreated} />

        {/* Right Panel: Jobs List */}
        <AgentJobsList refreshTrigger={refreshTrigger} locale={locale} />
      </div>
    </div>
  );
}
