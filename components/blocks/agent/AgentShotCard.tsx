/**
 * AgentShotCard
 * Card component for displaying an individual shot in the Agent job detail view
 */

"use client";

import { useRef, useState } from 'react';
import { AgentShot, AgentShotStatusMap } from '@/types/agent';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Film, Image as ImageIcon, Download, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInViewport } from '@/hooks/useInViewport';
import { useAutoLoadMedia } from '@/hooks/useAutoLoadMedia';

interface AgentShotCardProps {
  shot: AgentShot;
  showVideoActions?: boolean;
}

export function AgentShotCard({ shot, showVideoActions = true }: AgentShotCardProps) {
  const keyframeStatusInfo = AgentShotStatusMap[shot.keyframe_status] || {
    label: shot.keyframe_status,
    color: 'gray',
  };
  const videoStatusInfo = AgentShotStatusMap[shot.video_status] || {
    label: shot.video_status,
    color: 'gray',
  };
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const shouldAutoLoad = useAutoLoadMedia();
  const isInViewport = useInViewport(containerRef, { rootMargin: '200px 0px', threshold: 0.1 });
  const shouldLoadVideo = (shouldAutoLoad && isInViewport) || hasInteracted;

  const getStatusBadgeVariant = (
    status: AgentShot['keyframe_status'] | AgentShot['video_status']
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'done':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'generating':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleViewKeyframe = () => {
    if (shot.keyframe_url) {
      window.open(shot.keyframe_url, '_blank');
    }
  };

  const handleViewVideo = () => {
    if (shot.video_url) {
      window.open(shot.video_url, '_blank');
    }
  };

  const handleDownloadVideo = () => {
    if (shot.video_url) {
      const link = document.createElement('a');
      link.href = shot.video_url;
      link.download = `shot_${shot.shot_number}.mp4`;
      link.click();
    }
  };

  return (
    <Card className="bg-gray-700/50 border-gray-700 text-gray-200 flex flex-col">
      <CardContent className="p-4 space-y-3">
        {/* Shot Number Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Shot #{shot.shot_number}
          </Badge>
          <span className="text-xs text-gray-400">{shot.duration_seconds}s</span>
        </div>

        {/* Thumbnail */}
        <div className="aspect-video bg-gray-700 rounded-md flex items-center justify-center overflow-hidden relative">
          {shot.keyframe_url ? (
            <img
              src={shot.keyframe_url}
              alt={`Shot ${shot.shot_number} keyframe`}
              className="w-full h-full object-cover"
            />
          ) : shot.video_url ? (
            <div
              ref={containerRef}
              className="w-full h-full"
              onPointerEnter={() => setHasInteracted(true)}
              onFocus={() => setHasInteracted(true)}
              onTouchStart={() => setHasInteracted(true)}
            >
              <video
                src={shouldLoadVideo ? shot.video_url : undefined}
                className="w-full h-full object-cover"
                preload={shouldLoadVideo ? 'metadata' : 'none'}
                playsInline
                muted
                controls={false}
              />
            </div>
          ) : (
            <Film className="h-12 w-12 text-gray-500" />
          )}

          {/* Status badges overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
            <Badge
              variant={getStatusBadgeVariant(shot.keyframe_status)}
              className={cn(
                'text-xs flex items-center gap-1',
                shot.keyframe_status === 'done' &&
                  'bg-green-600 hover:bg-green-700 text-white border-transparent',
                shot.keyframe_status === 'generating' && 'bg-blue-500'
              )}
            >
              {shot.keyframe_status === 'generating' && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              <ImageIcon className="h-3 w-3" />
              {keyframeStatusInfo.label}
            </Badge>

            <Badge
              variant={getStatusBadgeVariant(shot.video_status)}
              className={cn(
                'text-xs flex items-center gap-1',
                shot.video_status === 'done' &&
                  'bg-green-600 hover:bg-green-700 text-white border-transparent',
                shot.video_status === 'generating' && 'bg-purple-500'
              )}
            >
              {shot.video_status === 'generating' && <Loader2 className="h-3 w-3 animate-spin" />}
              <Film className="h-3 w-3" />
              {videoStatusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Prompt */}
        <p className="text-sm text-gray-300 line-clamp-2" title={shot.prompt}>
          {shot.prompt}
        </p>
      </CardContent>

      {/* Actions */}
      {showVideoActions && (
        <CardFooter className="p-4 pt-0 flex gap-2">
          {shot.keyframe_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewKeyframe}
              className="flex-1 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white text-xs"
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Keyframe
            </Button>
          )}

          {shot.video_url && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewVideo}
                className="flex-1 border-green-500 text-green-500 hover:bg-green-500 hover:text-white text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadVideo}
                className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white text-xs"
              >
                <Download className="h-3 w-3" />
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
