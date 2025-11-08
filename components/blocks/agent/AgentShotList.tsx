/**
 * AgentShotList
 * Grid view of all shots in an Agent job
 */

"use client";

import { AgentShot } from '@/types/agent';
import { AgentShotCard } from './AgentShotCard';
import { AlertTriangle } from 'lucide-react';

interface AgentShotListProps {
  shots: AgentShot[];
}

export function AgentShotList({ shots }: AgentShotListProps) {
  if (!shots || shots.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-400">No shots generated yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Shots will appear here as the Agent generates them
        </p>
      </div>
    );
  }

  // Sort shots by shot_number
  const sortedShots = [...shots].sort((a, b) => a.shot_number - b.shot_number);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedShots.map(shot => (
        <AgentShotCard key={shot.id} shot={shot} />
      ))}
    </div>
  );
}
