/**
 * AgentAssetGrid
 * Grid layout for displaying job assets (script, images, videos)
 */

"use client";

import React, { useMemo, useState } from 'react';
import { AgentShot } from '@/types/agent';
import { AssetModal } from './AssetModal';

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

      // 4. Final video
      if (finalVideoUrl) {
        result.push({
          id: 'final-video',
          type: 'video',
          url: finalVideoUrl,
          title: 'Final Video',
        });
      }

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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {assets.map(asset => (
            <div
              key={asset.id}
              className="aspect-video bg-gray-800 rounded-lg overflow-hidden cursor-pointer relative transition-transform hover:scale-105"
              onClick={() => setSelectedAsset(asset)}
            >
              {/* Asset content */}
              {asset.type === 'script' && (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <div className="text-5xl">📝</div>
                </div>
              )}

              {asset.type === 'image' && asset.url && (
                <img
                  src={asset.url}
                  alt={asset.title}
                  className="w-full h-full object-cover"
                />
              )}

              {asset.type === 'video' && asset.url && (
                <video
                  src={asset.url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              )}

              {/* Type badge (top-left) */}
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                <span className={getAssetTypeColor(asset.type)}>
                  {getAssetTypeLabel(asset.type).split(' ')[0]}
                </span>
                <span className="text-white">{getAssetTypeLabel(asset.type).split(' ')[1]}</span>
              </div>

              {/* Info overlay (bottom) */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="text-xs text-white font-medium">
                  {asset.type === 'script' && `${shots.length} shots`}
                  {asset.type === 'image' && asset.shotNumber && `Shot #${asset.shotNumber}`}
                  {asset.type === 'video' && asset.shotNumber && (
                    <>Shot #{asset.shotNumber} • {asset.duration}s</>
                  )}
                  {asset.type === 'video' && !asset.shotNumber && 'Final Video'}
                </div>
              </div>
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
