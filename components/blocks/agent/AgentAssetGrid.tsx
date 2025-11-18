/**
 * AgentAssetGrid
 * Grid layout for displaying job assets (script, images, videos)
 */

"use client";

import React, { useMemo, useState } from 'react';
import { AgentShot } from '@/types/agent';
import { AssetModal } from './AssetModal';
import { FileText, PlayCircle, Sparkles, Users } from 'lucide-react';

type AssetType = 'script' | 'image' | 'video' | 'story' | 'character_refs';

interface Asset {
  id: string;
  type: AssetType;
  url?: string;
  content?: string;
  shotNumber?: number;
  duration?: number;
  title?: string;
  extraCount?: number;
}

interface AgentAssetGridProps {
  shots: AgentShot[];
  finalVideoUrl?: string;
  storyOutline?: Record<string, any> | null;
  mainCharacters?: Array<Record<string, any>> | null;
  characterReferenceImages?: string[] | null;
  locale: string;
}

export const AgentAssetGrid: React.FC<AgentAssetGridProps> = React.memo(
  ({ shots, finalVideoUrl, storyOutline, mainCharacters, characterReferenceImages, locale }) => {
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Aggregate all assets from shots and job-level metadata
    const assets = useMemo(() => {
      const result: Asset[] = [];

      // 1. Story + Characters + Script summary card（合并展示）
      const acts =
        storyOutline &&
        (storyOutline as any).acts &&
        Array.isArray((storyOutline as any).acts)
          ? (storyOutline as any).acts
          : [];
      const theme = storyOutline ? (storyOutline as any).theme : undefined;
      const tone = storyOutline ? (storyOutline as any).tone : undefined;
      const characters = mainCharacters && Array.isArray(mainCharacters) ? mainCharacters : [];

      if (shots && shots.length > 0) {
        const lines: string[] = [];
        if (theme) lines.push(`Theme: ${theme}`);
        if (tone) lines.push(`Tone: ${tone}`);
        if (acts.length > 0) {
          lines.push('');
          lines.push('Acts:');
          acts.forEach((act: any, index: number) => {
            const title = act.title || `Act ${index + 1}`;
            const summary = act.summary || act.description || '';
            lines.push(`- ${title}: ${summary}`);
          });
        }
        if (characters.length > 0) {
          lines.push('');
          lines.push('Main Characters:');
          characters.forEach((char: any, index: number) => {
            const name = char.name || `Character ${index + 1}`;
            const role = char.role ? ` (${char.role})` : '';
            const traits = Array.isArray(char.traits)
              ? char.traits.join(', ')
              : typeof char.traits === 'string'
              ? char.traits
              : '';
            const appearance = char.appearance || '';
            const parts = [`- ${name}${role}`];
            if (traits) {
              parts.push(`Traits: ${traits}`);
            }
            if (appearance) {
              parts.push(`Appearance: ${appearance}`);
            }
            lines.push(parts.join(' | '));
          });
        }

        // 追加脚本信息
        const scriptContent = shots
          .map((s) => `Shot ${s.shot_number} (${s.duration_seconds}s): ${s.prompt}`)
          .join('\n\n');
        lines.push('');
        lines.push('Script:');
        lines.push(scriptContent);

        result.push({
          id: 'story-script',
          type: 'story',
          content: lines.join('\n'),
          title: 'Story & Script',
        });
      }

      // 2. Character reference images (always show all and place before keyframes)
      const refImages =
        characterReferenceImages && Array.isArray(characterReferenceImages)
          ? characterReferenceImages.filter(Boolean)
          : [];
      if (refImages.length > 0) {
        refImages.forEach((url, index) => {
          result.push({
            id: `character-refs-${index}`,
            type: 'character_refs',
            url,
            title:
              refImages.length > 1
                ? `Character Reference #${index + 1}`
                : 'Character Reference',
          });
        });
      }

      // 3. Keyframe images
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

      // 4. Shot videos
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
    }, [shots, finalVideoUrl, storyOutline, mainCharacters, characterReferenceImages]);

    const getAssetTypeLabel = (type: AssetType) => {
      switch (type) {
        case 'script':
          return '📝 Script';
        case 'image':
          return '📷 Image';
        case 'video':
          return '🎬 Video';
        case 'story':
          return '📖 Story & Characters';
        case 'character_refs':
          return '🧑‍🎨 Character Refs';
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
        case 'story':
          return 'text-amber-400';
        case 'character_refs':
          return 'text-pink-400';
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

              {/* Story + Script Card */}
              {asset.type === 'story' && (
                <div className="w-full h-full bg-amber-200 dark:bg-amber-900/40 flex items-center justify-center px-3">
                  <div className="text-center text-amber-900 dark:text-amber-100 space-y-1">
                    <Sparkles className="w-7 h-7 mx-auto" />
                    <p className="text-sm font-semibold">Story &amp; Script</p>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-100/80">
                      Outline, characters, and per-shot script
                    </p>
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

              {/* Character Reference Images */}
              {asset.type === 'character_refs' && asset.url && (
                <>
                  <img
                    src={asset.url}
                    alt={asset.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-2 left-2 flex items-center gap-1 text-xs font-medium text-white bg-black/40 px-2 py-0.5 rounded-full">
                    <Users className="w-3 h-3" />
                    <span>Character Refs</span>
                  </div>
                  {asset.extraCount && asset.extraCount > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                      +{asset.extraCount - 1} more
                    </div>
                  )}
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
