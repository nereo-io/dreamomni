/**
 * AgentAssetGrid
 * Grid layout for displaying job assets (script, images, videos)
 */

"use client";

import React, { useMemo, useState } from 'react';
import { AgentShot } from '@/types/agent';
import { AssetModal } from './AssetModal';
import { FileText, PlayCircle } from 'lucide-react';

type AssetType = 'script' | 'image' | 'video';

interface Asset {
  id: string;
  type: AssetType;
  url?: string;
  content?: string;
  shotNumber?: number;
  duration?: number;
  title?: string;
}

interface AgentAssetGridProps {
  shots: AgentShot[];
  finalVideoUrl?: string;
  locale: string;
}

export const AgentAssetGrid: React.FC<AgentAssetGridProps> = React.memo(
  ({ shots, finalVideoUrl, locale }) => {
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Aggregate all assets from shots
    const assets = useMemo(() => {
      const result: Asset[] = [];

      // 1. Script (if there are multiple shots, generate script content)
      if (shots && shots.length > 0) {
        const scriptContent = shots
          .map((s, i) => `Shot ${s.shot_number} (${s.duration_seconds}s): ${s.prompt}`)
          .join('\n\n');
        result.push({
          id: 'script',
          type: 'script',
          content: scriptContent,
          title: 'Script',
        });
      }

      // 2. Keyframe images
      shots?.forEach(shot => {
        if (shot.keyframe_url) {
          result.push({
            id: `keyframe-${shot.id}`,
            type: 'image',
            url: shot.keyframe_url,
            shotNumber: shot.shot_number,
            title: `Shot #${shot.shot_number} Keyframe`,
          });
        }
      });

      // 3. Shot videos
      shots?.forEach(shot => {
        if (shot.video_url) {
          result.push({
            id: `video-${shot.id}`,
            type: 'video',
            url: shot.video_url,
            shotNumber: shot.shot_number,
            duration: shot.duration_seconds,
            title: `Shot #${shot.shot_number} Video`,
          });
        }
      });

      // 4. Final video is now rendered separately in AgentJobItem
      // We don't include it in the grid anymore

      return result;
    }, [shots, finalVideoUrl]);

    const getAssetTypeLabel = (type: AssetType) => {
      switch (type) {
        case 'script':
          return '📝 Script';
        case 'image':
          return '📷 Image';
        case 'video':
          return '🎬 Video';
        default:
          return '';
      }
    };

    const getAssetTypeColor = (type: AssetType) => {
      switch (type) {
        case 'script':
          return 'text-purple-400';
        case 'image':
          return 'text-blue-400';
        case 'video':
          return 'text-green-400';
        default:
          return 'text-gray-400';
      }
    };

    if (assets.length === 0) {
      return null;
    }

    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {assets.map(asset => (
            <div
              key={asset.id}
              className="relative group aspect-video rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
              onClick={() => setSelectedAsset(asset)}
            >
              {/* Script Card */}
              {asset.type === 'script' && (
                <div className="w-full h-full bg-purple-200 dark:bg-purple-900/40 flex items-center justify-center">
                  <div className="text-center text-purple-800 dark:text-purple-200">
                    <FileText className="w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium mt-1">Script</p>
                  </div>
                </div>
              )}

              {/* Keyframe Image */}
              {asset.type === 'image' && asset.url && (
                <>
                  <img
                    src={asset.url}
                    alt={asset.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
                    Shot #{asset.shotNumber}
                  </div>
                </>
              )}

              {/* Video */}
              {asset.type === 'video' && asset.url && (
                <>
                  <video
                    src={asset.url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                  {/* Play icon - always visible */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-center justify-center transition-all">
                    <PlayCircle className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                  {/* Duration badge (top-right) */}
                  {asset.duration && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                      {asset.duration}s
                    </div>
                  )}
                  {/* Shot number (bottom-left) */}
                  <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
                    {asset.shotNumber ? `Shot #${asset.shotNumber}` : 'Final Video'}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Asset Modal */}
        {selectedAsset && (
          <AssetModal
            isOpen={!!selectedAsset}
            onClose={() => setSelectedAsset(null)}
            type={selectedAsset.type}
            data={{
              url: selectedAsset.url,
              content: selectedAsset.content,
              title: selectedAsset.title,
              shotNumber: selectedAsset.shotNumber,
            }}
          />
        )}
      </>
    );
  }
);

AgentAssetGrid.displayName = 'AgentAssetGrid';
