/**
 * AgentAssetGrid
 * Grid layout for displaying job assets (script, images, videos)
 */

"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { AgentShot, AgentJob, AgentAsset } from '@/types/agent';
import { AssetModal } from './AssetModal';
import { FileText, PlayCircle, Sparkles } from 'lucide-react';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';
import { getVideoModel } from '@/config/video-models';
import { useTranslations } from 'next-intl';

type AssetType = 'script' | 'image' | 'video' | 'story' | 'character_refs' | 'scene_ref';

interface StoryOutline {
  logline?: string;
  conflict?: string;
  ending?: string;
  sound_bed?: string;
  theme?: string;
  tone?: string;
  acts?: Array<{
    title?: string;
    summary?: string;
    description?: string;
  }>;
}

interface StoryElement {
  id?: string;
  description?: string;
}

interface StoryShotDetail {
  number?: number;
  duration?: number;
  prompt?: string;
  keyframePrompt?: string;
  keyframeMetadata?: Record<string, any> | null;
  keyframeStatus?: AgentShot['keyframe_status'];
  keyframeModelUsed?: string | null;
  keyframeAttempts?: Array<Record<string, any>> | null;
  videoStatus?: AgentShot['video_status'];
  videoModelUsed?: string | null;
  videoAttempts?: Array<Record<string, any>> | null;
  videoErrorMessage?: string | null;
}

interface StoryboardShotDetail {
  shot_number?: number;
  duration_seconds?: number;
  start_frame_brief?: string;
  story_description?: string;
  start_frame_element_refs?: string[];
}

interface StoryDetails {
  outline?: StoryOutline;
  characters: StoryElement[];
  scene?: StoryElement | null;
  storyboardShots?: StoryboardShotDetail[];
  shots: StoryShotDetail[];
  storyboardJson?: Record<string, any> | null;
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
  jobId: string;
  shots: AgentShot[];
  finalVideoUrl?: string;
  storyboardJson?: Record<string, any> | null;
  characterReferenceImages?: string[] | null;
  locale: string;
  aspectRatio?: string;
  keyframesEnabled?: boolean;
  progress?: AgentJob['progress'];
  referenceImageUrls?: string[];
  jobStatus?: AgentJob['status'];
  createdAt?: string;
  videoModelId?: string;
  jobUpdatedAt?: string;
}

export const AgentAssetGrid: React.FC<AgentAssetGridProps> = React.memo(
  ({ jobId, shots, finalVideoUrl: _finalVideoUrl, storyboardJson, characterReferenceImages, locale, aspectRatio = '16:9', keyframesEnabled = true, progress, referenceImageUrls, jobStatus, createdAt, videoModelId, jobUpdatedAt }) => {
    const t = useTranslations("agentJobs");
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [sceneAssets, setSceneAssets] = useState<AgentAsset[]>([]);
    const [sceneAssetsStatus, setSceneAssetsStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const showAgentInternals = process.env.NEXT_PUBLIC_AGENT_INTERNALS === 'true';
    const aspectRatioValue =
      aspectRatio === '9:16'
        ? '9 / 16'
        : aspectRatio === '4:3'
        ? '4 / 3'
        : '16 / 9';
    const minCardWidth =
      aspectRatio === '9:16' ? 120 : aspectRatio === '4:3' ? 128 : 160;
    const fallbackBackground =
      (characterReferenceImages && characterReferenceImages[0]) ||
      (referenceImageUrls && referenceImageUrls[0]) ||
      undefined;
    const storyboardRoot = (() => {
      if (!storyboardJson || typeof storyboardJson !== 'object') return null;
      const nested = (storyboardJson as any).storyboard;
      if (nested && typeof nested === 'object') return nested as Record<string, any>;
      return storyboardJson as Record<string, any>;
    })();
    const outlineSource =
      (storyboardJson && typeof storyboardJson === 'object' && (storyboardJson as any).story_outline) ||
      (storyboardRoot && (storyboardRoot as any).story_outline) ||
      null;
    const storyOutline =
      outlineSource && typeof outlineSource === 'object' ? (outlineSource as StoryOutline) : null;
    const keyElements = Array.isArray((storyboardRoot as any)?.key_elements)
      ? (storyboardRoot as any).key_elements
      : [];
    const storyboardShots = Array.isArray((storyboardRoot as any)?.shots)
      ? (storyboardRoot as any).shots
      : [];
    const characterElements = keyElements.filter(
      (element: any) => element && element.type === 'character'
    );
    const sceneElement = keyElements.find(
      (element: any) => element && element.type === 'scene'
    ) || null;
    const characterCount = characterElements.length;
    const shouldShowCharacterPlaceholders =
      characterCount > 0 &&
      (!characterReferenceImages || characterReferenceImages.length === 0) &&
      ['pending', 'generating_script', 'generating_characters', 'splitting_shots', 'generating_keyframes'].includes(jobStatus || '');
    const shouldShowScenePlaceholder =
      !!sceneElement &&
      sceneAssets.length === 0 &&
      sceneAssetsStatus !== 'error' &&
      ['pending', 'generating_script', 'generating_characters', 'splitting_shots', 'generating_keyframes'].includes(jobStatus || '');
    const isImageStage = ['generating_characters', 'generating_keyframes', 'waiting_for_confirmation', 'orchestrating_videos', 'generating_videos', 'splicing', 'completed', 'failed'].includes(jobStatus || '');
    const isKeyframeStage = keyframesEnabled && ['generating_keyframes', 'waiting_for_confirmation', 'orchestrating_videos', 'generating_videos', 'splicing', 'completed', 'failed'].includes(jobStatus || '');
    const isVideoStage = ['orchestrating_videos', 'generating_videos', 'splicing', 'completed', 'failed'].includes(jobStatus || '');
    const isJobFailed = jobStatus === 'failed';
    const imageEstimateSeconds = 15;
    const modelConfig = videoModelId ? getVideoModel(videoModelId) : undefined;
    const videoEstimateSeconds = modelConfig?.estimatedGenerationTime || 20;
    const { progress: estimatedImageProgress } = useGenerationProgress({
      createdAt: createdAt || '',
      estimatedTime: imageEstimateSeconds,
      status: isImageStage ? 'IN_PROGRESS' : 'submitted'
    });
    const { progress: estimatedVideoProgress } = useGenerationProgress({
      createdAt: createdAt || '',
      estimatedTime: videoEstimateSeconds,
      status: isVideoStage ? 'IN_PROGRESS' : 'submitted'
    });

    useEffect(() => {
      let cancelled = false;

      const fetchSceneAssets = async () => {
        if (!jobId) return;
        try {
          setSceneAssetsStatus('loading');
          const res = await fetch(`/api/agent/jobs/${jobId}/assets?asset_type=scene_ref&limit=10&offset=0`);
          if (!res.ok) {
            throw new Error('Failed to fetch scene assets');
          }
          const payload = await res.json();
          if (cancelled) return;
          const assets = Array.isArray(payload?.assets)
            ? payload.assets
            : Array.isArray(payload)
            ? payload
            : [];
          setSceneAssets(
            assets.filter((asset: AgentAsset) => asset && asset.asset_type === 'scene_ref')
          );
          setSceneAssetsStatus('idle');
        } catch (error) {
          if (cancelled) return;
          console.error('[AgentAssetGrid] Fetch scene assets failed:', error);
          setSceneAssets([]);
          setSceneAssetsStatus('error');
        }
      };

      fetchSceneAssets();

      return () => {
        cancelled = true;
      };
    }, [jobId, jobUpdatedAt]);

    // Aggregate all assets from shots and job-level metadata
    const assets = useMemo(() => {
      const result: Asset[] = [];

      // Calculate derived progress values inside useMemo
      const storyProgressValue = 0; // Story generation doesn't have trackable progress
      const characterProgressValue = estimatedImageProgress ?? 0;
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
      const normalizedOutline = storyOutline && typeof storyOutline === 'object' ? storyOutline : {};
      const acts =
        normalizedOutline.acts && Array.isArray(normalizedOutline.acts)
          ? normalizedOutline.acts
          : [];
      const theme = normalizedOutline.theme;
      const tone = normalizedOutline.tone;
      const logline = normalizedOutline.logline;
      const conflict = normalizedOutline.conflict;
      const ending = normalizedOutline.ending;
      const soundBed = normalizedOutline.sound_bed;

      if (showAgentInternals && shots && shots.length > 0) {
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
            keyframeModelUsed: shot.keyframe_model_used ?? null,
            keyframeAttempts: shot.keyframe_attempts ?? null,
            videoStatus: shot.video_status,
            videoModelUsed: shot.model_used ?? null,
            videoAttempts: shot.attempts ?? null,
            videoErrorMessage: shot.video_error_message ?? null,
          };
        });

        const lines: string[] = [];
        if (logline) lines.push(`Logline: ${logline}`);
        if (conflict) lines.push(`Conflict: ${conflict}`);
        if (ending) lines.push(`Ending: ${ending}`);
        if (soundBed) lines.push(`Sound bed: ${soundBed}`);
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
        if (characterElements.length > 0) {
          lines.push('');
          lines.push('Characters:');
          characterElements.forEach((char: any, index: number) => {
            const label = char?.id || `Character ${index + 1}`;
            const description = char?.description || '';
            lines.push(`- ${label}${description ? `: ${description}` : ''}`);
          });
        }
        if (sceneElement) {
          lines.push('');
          lines.push('Scene:');
          const sceneLabel = (sceneElement as any)?.id || 'Scene';
          const sceneDescription = (sceneElement as any)?.description || '';
          lines.push(`- ${sceneLabel}${sceneDescription ? `: ${sceneDescription}` : ''}`);
        }
        if (storyboardShots.length > 0) {
          lines.push('');
          lines.push('Storyboard Shots:');
          storyboardShots.forEach((shot: any, index: number) => {
            const number = shot?.shot_number ?? index + 1;
            const startFrame = shot?.start_frame_brief || '';
            const storyDescription = shot?.story_description || '';
            const parts = [`- Shot ${number}`];
            if (startFrame) parts.push(`Start frame: ${startFrame}`);
            if (storyDescription) parts.push(`Story: ${storyDescription}`);
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
        lines.push(`${t("assets.script")}:`);
        lines.push(scriptContent);

        result.push({
          id: 'story-script',
          type: 'story',
          content: lines.join('\n'),
          title: t("assets.storyScript"),
          loading: ['pending', 'splitting_shots'].includes(jobStatus || ''),
          progressValue: storyProgressValue,
          storyDetails: {
            outline: storyOutline || undefined,
            characters: characterElements.map((character: any) => ({
              id: character?.id,
              description: character?.description,
            })),
            scene: sceneElement
              ? {
                  id: (sceneElement as any)?.id,
                  description: (sceneElement as any)?.description,
                }
              : null,
            storyboardShots: storyboardShots.map((shot: any, index: number) => ({
              shot_number: shot?.shot_number ?? index + 1,
              duration_seconds: shot?.duration_seconds,
              start_frame_brief: shot?.start_frame_brief,
              story_description: shot?.story_description,
              start_frame_element_refs: Array.isArray(shot?.start_frame_element_refs)
                ? shot.start_frame_element_refs
                : undefined,
            })),
            shots: structuredShots,
            storyboardJson: storyboardJson ?? null,
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
                ? `${t("assets.ref")} #${index + 1}`
                : `${t("assets.ref")} #1`,
          });
        });
      }
      // Character reference placeholders (when characters存在但图片未出)
      if (shouldShowCharacterPlaceholders && refImages.length === 0) {
        Array.from({ length: characterCount }).forEach((_, index) => {
          result.push({
            id: `character-refs-loading-${index}`,
            type: 'character_refs',
            title: `${t("assets.ref")} #${index + 1}`,
            loading: true,
            backgroundUrl: fallbackBackground,
            progressValue: characterProgressValue,
          });
        });
      }

      // 2.5 Scene reference image
      const sceneRefAssets = sceneAssets.filter(asset => asset.asset_type === 'scene_ref');
      if (sceneRefAssets.length > 0) {
        sceneRefAssets.forEach((asset, index) => {
          const isFailed = asset.status === 'failed';
          const isLoading = !isFailed && (!asset.url || asset.status === 'pending' || asset.status === 'generating');
          result.push({
            id: `scene-ref-${asset.id || index}`,
            type: 'scene_ref',
            url: asset.url,
            title: sceneElement?.id ? `${sceneElement.id} ${t("assets.sceneRef")}` : `${t("assets.sceneRef")} #${index + 1}`,
            status: asset.status,
            loading: isLoading,
            backgroundUrl: asset.url ? undefined : fallbackBackground,
            progressValue: isLoading ? characterProgressValue : undefined,
          });
        });
      } else if (shouldShowScenePlaceholder) {
        result.push({
          id: 'scene-ref-loading',
          type: 'scene_ref',
          title: sceneElement?.id ? `${sceneElement.id} ${t("assets.sceneRef")}` : t("assets.sceneRef"),
          loading: true,
          backgroundUrl: fallbackBackground,
          progressValue: characterProgressValue,
        });
      }

      // 3. Keyframe images
      shots?.forEach(shot => {
        const normalizedKeyframeStatus =
          isJobFailed && !['done', 'failed', 'skipped'].includes(shot.keyframe_status)
            ? 'failed'
            : shot.keyframe_status;
        const isKeyframeVisible =
          isKeyframeStage || !!shot.keyframe_url || normalizedKeyframeStatus === 'failed';
        if (!isKeyframeVisible) return;
        const isKeyframeFailed = normalizedKeyframeStatus === 'failed';
        const isKeyframeDone = normalizedKeyframeStatus === 'done' && !!shot.keyframe_url;
        const isKeyframeSkipped = normalizedKeyframeStatus === 'skipped';
        const isKeyframeLoading = !isKeyframeFailed && !isKeyframeDone && !isKeyframeSkipped;
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
          title: `${t("assets.shot")} #${shot.shot_number} ${t("assets.image")}`,
          status: normalizedKeyframeStatus,
          loading: isKeyframeLoading,
          backgroundUrl,
          progressValue,
        });
      });

      // 4. Shot videos
      shots?.forEach(shot => {
        const normalizedVideoStatus =
          isJobFailed && !['done', 'failed'].includes(shot.video_status)
            ? 'failed'
            : shot.video_status;
        if (!isVideoStage && !shot.video_url && normalizedVideoStatus !== 'failed') {
          return;
        }
        const isVideoFailed = normalizedVideoStatus === 'failed';
        const isVideoDone = normalizedVideoStatus === 'done' && !!shot.video_url;
        const hasVideoStarted =
          isVideoStage || normalizedVideoStatus === 'generating' || isVideoDone || isVideoFailed;
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
          title: `${t("assets.shot")} #${shot.shot_number} ${t("assets.video")}`,
          status: normalizedVideoStatus,
          loading: isVideoLoading,
          backgroundUrl,
          progressValue,
        });
      });

      // 4. Final video is now rendered separately in AgentJobItem
      // We don't include it in the grid anymore

      return result;
    }, [shots, storyOutline, characterElements, sceneElement, storyboardShots, storyboardJson, characterReferenceImages, progress, fallbackBackground, shouldShowCharacterPlaceholders, shouldShowScenePlaceholder, characterCount, jobStatus, isKeyframeStage, isVideoStage, isJobFailed, estimatedImageProgress, estimatedVideoProgress, sceneAssets, t, showAgentInternals]);

    const getAssetTypeLabel = (type: AssetType) => {
      switch (type) {
        case 'script':
          return `📝 ${t("assets.script")}`;
        case 'image':
          return `📷 ${t("assets.image")}`;
        case 'video':
          return `🎬 ${t("assets.video")}`;
        case 'story':
          return `📖 ${t("assets.storyScript")}`;
        case 'character_refs':
          return `🧑‍🎨 ${t("assets.characterRefs")}`;
        case 'scene_ref':
          return `🏞️ ${t("assets.sceneRef")}`;
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
        case 'scene_ref':
          return 'text-sky-400';
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
        <div className="text-red-300 text-sm font-medium">{t("item.failed")}</div>
      </div>
    );

    if (assets.length === 0) {
      return null;
    }

    return (
      <>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
        >
          {assets.map(asset => (
            <div
              key={asset.id}
              className="relative group w-full rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
              style={{ aspectRatio: aspectRatioValue }}
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
                    <p className="text-sm font-medium mt-1">{t("assets.script")}</p>
                  </div>
                </div>
              )}

              {/* Story + Script Card */}
              {asset.type === 'story' && (
                <div className="w-full h-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center px-3">
                  <div className="text-center text-sky-900 dark:text-sky-50" title={t("assets.storyScript")}>
                    <Sparkles className="w-7 h-7 mx-auto" />
                    <span className="sr-only">{t("assets.storyScript")}</span>
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
                      +{asset.extraCount - 1} {t("assets.more")}
                    </div>
                  )}
                </>
              )}

              {/* Scene Reference Image */}
              {asset.type === 'scene_ref' && asset.url && (
                <>
                  <img
                    src={asset.url}
                    alt={asset.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div
                    className="absolute top-2 left-2 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded-md max-w-[80%] truncate"
                    title={asset.title || 'Scene Ref'}
                  >
                    {asset.title || 'Scene Ref'}
                  </div>
                </>
              )}

              {asset.type === 'scene_ref' && !asset.url && asset.status !== 'failed' && !asset.loading && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
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
                    {asset.shotNumber ? `${t("assets.shot")} #${asset.shotNumber}` : t("assets.finalVideo")}
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
