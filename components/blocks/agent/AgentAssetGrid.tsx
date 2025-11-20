/**
 * AgentAssetGrid
 * Grid layout for displaying job assets (script, images, videos)
 */

"use client";

import React, { useMemo, useState } from 'react';
import { AgentShot, AgentJob } from '@/types/agent';
import { AssetModal } from './AssetModal';
import { FileText, PlayCircle, Sparkles } from 'lucide-react';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';
import { getVideoModel } from '@/config/video-models';

type AssetType = 'script' | 'image' | 'video' | 'story' | 'character_refs';

interface StoryAct {
  title: string;
  summary?: string;
}

interface StoryCharacter {
  name?: string;
  role?: string;
  traits?: string;
  appearance?: string;
  description?: string;
}

interface StoryShotDetail {
  number?: number;
  duration?: number;
  prompt?: string;
  keyframePrompt?: string;
  keyframeMetadata?: Record<string, any> | null;
  keyframeStatus?: AgentShot['keyframe_status'];
  videoStatus?: AgentShot['video_status'];
}

interface StoryDetails {
  theme?: string;
  tone?: string;
  acts: StoryAct[];
  characters: StoryCharacter[];
  shots: StoryShotDetail[];
}

interface Asset {
  id: string;
  type: AssetType;
  url?: string;
  content?: string;
  shotNumber?: number;
  duration?: number;
  title?: string;
  extraCount?: number;
  status?: string;
  loading?: boolean;
  backgroundUrl?: string;
  progressValue?: number;
  storyDetails?: StoryDetails;
  totalDurationSeconds?: number;
  shotsCount?: number;
}

interface AgentAssetGridProps {
  shots: AgentShot[];
  finalVideoUrl?: string;
  storyOutline?: Record<string, any> | null;
  mainCharacters?: Array<Record<string, any>> | null;
  characterReferenceImages?: string[] | null;
  locale: string;
  aspectRatio?: string;
  progress?: AgentJob['progress'];
  referenceImageUrl?: string;
  jobStatus?: AgentJob['status'];
  createdAt?: string;
  videoModelId?: string;
}

export const AgentAssetGrid: React.FC<AgentAssetGridProps> = React.memo(
  ({ shots, finalVideoUrl: _finalVideoUrl, storyOutline, mainCharacters, characterReferenceImages, locale, aspectRatio = '16:9', progress, referenceImageUrl, jobStatus, createdAt, videoModelId }) => {
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const aspectRatioValue = aspectRatio === '4:3' ? '4 / 3' : '16 / 9';
    const maxCardWidth = aspectRatio === '4:3' ? 186 : 248;
    const fallbackBackground =
      (characterReferenceImages && characterReferenceImages[0]) ||
      referenceImageUrl ||
      undefined;
    const characterCount = mainCharacters && Array.isArray(mainCharacters) ? mainCharacters.length : 0;
    const shouldShowCharacterPlaceholders =
      characterCount > 0 &&
      (!characterReferenceImages || characterReferenceImages.length === 0) &&
      ['pending', 'generating_script', 'generating_characters', 'splitting_shots', 'generating_keyframes'].includes(jobStatus || '');
    const isKeyframeStage = ['generating_keyframes', 'waiting_for_confirmation', 'orchestrating_videos', 'generating_videos', 'splicing', 'completed', 'failed'].includes(jobStatus || '');
    const isVideoStage = ['orchestrating_videos', 'generating_videos', 'splicing', 'completed', 'failed'].includes(jobStatus || '');
    const imageEstimateSeconds = 15;
    const modelConfig = videoModelId ? getVideoModel(videoModelId) : undefined;
    const videoEstimateSeconds = modelConfig?.estimatedGenerationTime || 20;
    const { progress: estimatedImageProgress } = useGenerationProgress({
      createdAt: createdAt || new Date().toISOString(),
      estimatedTime: imageEstimateSeconds,
      status: isKeyframeStage ? 'IN_PROGRESS' : 'submitted'
    });
    const { progress: estimatedVideoProgress } = useGenerationProgress({
      createdAt: createdAt || new Date().toISOString(),
      estimatedTime: videoEstimateSeconds,
      status: isVideoStage ? 'IN_PROGRESS' : 'submitted'
    });

    // Aggregate all assets from shots and job-level metadata
    const assets = useMemo(() => {
      const result: Asset[] = [];

      // Calculate derived progress values inside useMemo
      const storyProgressValue = progress?.script?.progress ?? 0;
      const characterProgressValue = progress?.characters?.progress ?? estimatedImageProgress ?? 0;
      const keyframeProgressValue =
        progress?.keyframes && progress.keyframes.total > 0
          ? (progress.keyframes.done / progress.keyframes.total) * 100
          : estimatedImageProgress;
      const videoProgressValue =
        progress?.videos && progress.videos.total > 0
          ? (progress.videos.done / progress.videos.total) * 100
          : estimatedVideoProgress;
      const derivedKeyframeProgress = (() => {
        // Prioritize backend progress if available
        if (progress?.keyframes && progress.keyframes.total > 0) {
          return (progress.keyframes.done / progress.keyframes.total) * 100;
        }
        
        if (!shots || shots.length === 0) return undefined;
        const total = shots.length;
        let done = 0;
        let generating = 0;
        shots.forEach((shot) => {
          if (shot.keyframe_status === 'done') done += 1;
          else if (shot.keyframe_status === 'generating') generating += 1;
        });
        
        if (done === 0 && generating === 0) return undefined;
        
        const base = (done / total) * 100;
        // Add a small buffer for generating items so it shows as active
        const smoothing = generating > 0 ? 5 : 0;
        return Math.min(99, base + smoothing);
      })();

      const derivedVideoProgress = (() => {
        // Prioritize backend progress if available
        if (progress?.videos && progress.videos.total > 0) {
          return (progress.videos.done / progress.videos.total) * 100;
        }

        if (!shots || shots.length === 0) return undefined;
        const total = shots.length;
        let done = 0;
        let generating = 0;
        shots.forEach((shot) => {
          if (shot.video_status === 'done') done += 1;
          else if (shot.video_status === 'generating') generating += 1;
        });
        
        if (done === 0 && generating === 0) return undefined;
        
        const base = (done / total) * 100;
        const smoothing = generating > 0 ? 5 : 0;
        return Math.min(99, base + smoothing);
      })();

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
        const shotCount = shots.length;
        const totalDurationSeconds = shots.reduce((sum, shot) => sum + (shot.duration_seconds || 0), 0);
        const structuredShots: StoryShotDetail[] = shots.map((shot) => {
          const keyframePrompt =
            shot.keyframe_prompt ||
            (shot.keyframe_metadata && typeof (shot.keyframe_metadata as any).prompt === 'string'
              ? (shot.keyframe_metadata as any).prompt
              : undefined);
          return {
            number: shot.shot_number,
            duration: shot.duration_seconds,
            prompt: shot.prompt,
            keyframePrompt,
            keyframeMetadata:
              shot.keyframe_metadata && typeof shot.keyframe_metadata === 'object'
                ? (shot.keyframe_metadata as Record<string, any>)
                : undefined,
            keyframeStatus: shot.keyframe_status,
            videoStatus: shot.video_status,
          };
        });

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
        const scriptContentLines = shots.flatMap((s) => {
          const lines: string[] = [
            `Shot ${s.shot_number} (${s.duration_seconds}s): ${s.prompt}`
          ];
          const keyframePrompt =
            s.keyframe_prompt ||
            (s.keyframe_metadata && typeof s.keyframe_metadata.prompt === 'string'
              ? s.keyframe_metadata.prompt
              : undefined);
          if (keyframePrompt) {
            lines.push(`Keyframe prompt: ${keyframePrompt}`);
          }
          return lines;
        });
        const scriptContent = scriptContentLines.join('\n\n');
        lines.push('');
        lines.push('Script:');
        lines.push(scriptContent);

        result.push({
          id: 'story-script',
          type: 'story',
          content: lines.join('\n'),
          title: 'Story & Script',
          loading: ['pending', 'splitting_shots'].includes(jobStatus || ''),
          progressValue: storyProgressValue,
          storyDetails: {
            theme,
            tone,
            acts: acts.map((act: any, index: number) => ({
              title: act.title || `Act ${index + 1}`,
              summary: act.summary || act.description || '',
            })),
            characters: characters.map((character: any) => ({
              name: character.name,
              role: character.role,
              traits: character.traits,
              appearance: character.appearance,
              description: character.description,
            })),
            shots: structuredShots,
          },
          totalDurationSeconds,
          shotsCount: shotCount,
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
                ? `Ref #${index + 1}`
                : 'Ref #1',
          });
        });
      }
      // Character reference placeholders (when characters存在但图片未出)
      if (shouldShowCharacterPlaceholders && refImages.length === 0) {
        Array.from({ length: characterCount }).forEach((_, index) => {
          result.push({
            id: `character-refs-loading-${index}`,
            type: 'character_refs',
            title: `Ref #${index + 1}`,
            loading: true,
            backgroundUrl: fallbackBackground,
            progressValue: characterProgressValue,
          });
        });
      }

      // 3. Keyframe images
      shots?.forEach(shot => {
        const isKeyframeVisible = isKeyframeStage || !!shot.keyframe_url || shot.keyframe_status === 'failed';
        if (!isKeyframeVisible) return;
        const isKeyframeFailed = shot.keyframe_status === 'failed';
        const isKeyframeDone = shot.keyframe_status === 'done' && !!shot.keyframe_url;
        const isKeyframeLoading = !isKeyframeFailed && !isKeyframeDone;
        const backgroundUrl = shot.keyframe_url || fallbackBackground;
        
        // Improved progress logic: Backend > Derived > Estimated
        const progressValue =
          isKeyframeLoading
            ? (keyframeProgressValue ?? derivedKeyframeProgress ?? estimatedImageProgress)
            : isKeyframeDone
            ? 100
            : undefined;

        result.push({
          id: `keyframe-${shot.id}`,
          type: 'image',
          url: shot.keyframe_url,
          shotNumber: shot.shot_number,
          title: `Shot #${shot.shot_number} Keyframe`,
          status: shot.keyframe_status,
          loading: isKeyframeLoading,
          backgroundUrl,
          progressValue,
        });
      });

      // 4. Shot videos
      shots?.forEach(shot => {
        if (!isVideoStage && !shot.video_url && shot.video_status !== 'failed') {
          return;
        }
        const isVideoFailed = shot.video_status === 'failed';
        const isVideoDone = shot.video_status === 'done' && !!shot.video_url;
        const hasVideoStarted = isVideoStage || shot.video_status === 'generating' || isVideoDone || isVideoFailed;
        const isVideoLoading = hasVideoStarted && !isVideoFailed && !isVideoDone;
        const backgroundUrl = shot.keyframe_url || fallbackBackground;
        
        // Improved progress logic: Backend > Derived > Estimated
        const progressValue =
          isVideoLoading
            ? (videoProgressValue ?? derivedVideoProgress ?? estimatedVideoProgress)
            : isVideoDone
            ? 100
            : undefined;

        if (!hasVideoStarted && !shot.video_url) {
          return;
        }

        result.push({
          id: `video-${shot.id}`,
          type: 'video',
          url: shot.video_url,
          shotNumber: shot.shot_number,
          duration: shot.duration_seconds,
          title: `Shot #${shot.shot_number} Video`,
          status: shot.video_status,
          loading: isVideoLoading,
          backgroundUrl,
          progressValue,
        });
      });

      // 4. Final video is now rendered separately in AgentJobItem
      // We don't include it in the grid anymore

      return result;
    }, [shots, storyOutline, mainCharacters, characterReferenceImages, progress, fallbackBackground, shouldShowCharacterPlaceholders, characterCount, jobStatus, isKeyframeStage, isVideoStage, estimatedImageProgress, estimatedVideoProgress]);

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

    const renderLoadingOverlay = (backgroundUrl?: string) => {
      return (
        <>
          {backgroundUrl ? (
            <img
              src={backgroundUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(10px) brightness(0.6)' }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(index => (
                <span
                  key={index}
                  className="block w-2.5 h-2.5 rounded-full bg-white/80 animate-[agent-loader-bounce_1.2s_ease-in-out_infinite]"
                  style={{ animationDelay: `${index * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </>
      );
    };

    const renderFailedOverlay = () => (
      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
        <div className="text-red-300 text-sm font-medium">Generation failed</div>
      </div>
    );

    if (assets.length === 0) {
      return null;
    }

    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {assets.map(asset => (
            <div
              key={asset.id}
              className="relative group w-full max-h-[140px] rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
              style={{
                aspectRatio: aspectRatioValue,
                width: `min(100%, ${maxCardWidth}px)`,
              }}
              onClick={() => {
                if (asset.loading || asset.status === 'failed') return;
                setSelectedAsset(asset);
              }}
            >
              {asset.loading && renderLoadingOverlay(asset.backgroundUrl)}
              {asset.status === 'failed' && renderFailedOverlay()}

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
                <div className="w-full h-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center px-3">
                  <div className="text-center text-sky-900 dark:text-sky-50" title="Story &amp; Script">
                    <Sparkles className="w-7 h-7 mx-auto" />
                    <span className="sr-only">Story &amp; Script</span>
                  </div>
                </div>
              )}

              {/* Keyframe Image */}
              {asset.type === 'image' && asset.url && !asset.loading && asset.status !== 'failed' && (
                <>
                  <img
                    src={asset.url}
                    alt={asset.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-2 left-2 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded-md">
                    Shot #{asset.shotNumber}
                  </div>
                </>
              )}

              {asset.type === 'image' && !asset.url && asset.status !== 'failed' && !asset.loading && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
              )}

              {/* Character Reference Images */}
              {asset.type === 'character_refs' && asset.url && (
                <>
                  <img
                    src={asset.url}
                    alt={asset.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div
                    className="absolute top-2 left-2 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded-md max-w-[80%] truncate"
                    title={asset.title || 'Ref'}
                  >
                    {asset.title || 'Ref'}
                  </div>
                  {asset.extraCount && asset.extraCount > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                      +{asset.extraCount - 1} more
                    </div>
                  )}
                </>
              )}

              {/* Video */}
              {asset.type === 'video' && asset.url && !asset.loading && asset.status !== 'failed' && (
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
                  {/* Shot number (top-left) */}
                  <div className="absolute top-2 left-2 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded-md">
                    {asset.shotNumber ? `Shot #${asset.shotNumber}` : 'Final Video'}
                  </div>
                </>
              )}

              {asset.type === 'video' && !asset.url && asset.status !== 'failed' && !asset.loading && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
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
              storyDetails: selectedAsset.storyDetails,
              shotsCount: selectedAsset.shotsCount,
              totalDurationSeconds: selectedAsset.totalDurationSeconds,
            }}
          />
        )}
        <style jsx global>{`
          @keyframes agent-loader-bounce {
            0%, 100% {
              transform: translateY(0);
              opacity: 0.35;
            }
            50% {
              transform: translateY(-6px);
              opacity: 1;
            }
          }
        `}</style>
      </>
    );
  }
);

AgentAssetGrid.displayName = 'AgentAssetGrid';
