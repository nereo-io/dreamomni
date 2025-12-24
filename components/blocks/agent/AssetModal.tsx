/**
 * AssetModal
 * Unified modal for displaying asset details (script, image, video)
 * Uses shadcn Dialog component with keyboard navigation support
 */

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

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
  keyframeStatus?: string;
  keyframeModelUsed?: string | null;
  keyframeAttempts?: Array<Record<string, any>> | null;
  videoStatus?: string;
  videoModelUsed?: string | null;
  videoAttempts?: Array<Record<string, any>> | null;
  videoErrorMessage?: string | null;
}

interface StoryDetails {
  theme?: string;
  tone?: string;
  acts?: StoryAct[];
  characters?: StoryCharacter[];
  roleSceneReferencePrompt?: string;
  shots?: StoryShotDetail[];
}

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AssetType;
  data: {
    url?: string;
    content?: string;
    title?: string;
    shotNumber?: number;
    storyDetails?: StoryDetails;
    totalDurationSeconds?: number;
    shotsCount?: number;
  };
}

export function AssetModal({ isOpen, onClose, type, data }: AssetModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatStatusLabel = (status?: string) => {
    if (!status) return '';
    return status
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const getStatusBadgeClasses = (status?: string) => {
    switch (status) {
      case 'done':
        return 'border-emerald-400/30 text-emerald-300';
      case 'failed':
        return 'border-rose-400/40 text-rose-300';
      case 'generating':
      case 'generating_keyframes':
      case 'generating_videos':
        return 'border-amber-300/30 text-amber-200';
      default:
        return 'border-white/20 text-gray-200';
    }
  };

  const sanitizeKeyframePrompt = (prompt?: string, shotPrompt?: string) => {
    if (!prompt) return '';
    let result = prompt.trim();

    if (shotPrompt) {
      const trimmedShotPrompt = shotPrompt.trim();
      if (trimmedShotPrompt && result.includes(trimmedShotPrompt)) {
        result = result.replace(trimmedShotPrompt, '').trim();
      }
    }

    const contextIndex = result.toLowerCase().indexOf('shot context');
    if (contextIndex !== -1) {
      result = result.slice(0, contextIndex).trim();
    }

    return result || prompt;
  };

  // Reset media loading state when modal opens or data changes
  useEffect(() => {
    if (isOpen && (type === 'image' || type === 'character_refs' || type === 'video')) {
      setIsMediaLoading(true);
    } else {
      setIsMediaLoading(false);
    }
  }, [isOpen, data.url, type]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // ESC key is handled by Dialog component
      // Add space key for video pause/play
      if (type === 'video' && e.code === 'Space') {
        e.preventDefault();
        const video = document.querySelector('video');
        if (video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, type]);

  const handleCopy = async (text?: string, updateState = false) => {
    const value = text ?? data.content;
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        if (updateState) {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        }
        toast.success('Copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy');
      }
    }
  };

  const getDownloadableTextContent = () => {
    if (type === 'script' && data.content) return data.content;

    if (type === 'story' && data.storyDetails) {
      const { theme, tone, acts = [], characters = [], shots = [] } = data.storyDetails;
      return JSON.stringify(
        {
          story_outline: { theme, tone, acts },
          main_characters: characters,
          shots: shots.map((shot) => ({
            shot_number: shot.number,
            duration_seconds: shot.duration,
            prompt: shot.prompt,
            keyframe_prompt: shot.keyframePrompt,
            keyframe_status: shot.keyframeStatus,
            keyframe_model_used: shot.keyframeModelUsed,
            video_status: shot.videoStatus,
            model_used: shot.videoModelUsed,
            attempts: shot.videoAttempts,
            video_error_message: shot.videoErrorMessage,
          })),
          total_duration_seconds: data.totalDurationSeconds,
          shots_count: data.shotsCount,
        },
        null,
        2
      );
    }

    return null;
  };

  const handleDownload = () => {
    if (data.url) {
      const link = document.createElement('a');
      link.href = data.url;
      const ext =
        type === 'video'
          ? 'mp4'
          : type === 'image' || type === 'character_refs'
          ? 'png'
          : type === 'story' || type === 'script'
          ? 'json'
          : 'txt';
      link.download = `${type}_${data.shotNumber || 'asset'}.${ext}`;
      link.click();
      return;
    }

    const content = getDownloadableTextContent();
    if (!content) return;

    const blob = new Blob([content], {
      type: type === 'story' || type === 'script' ? 'application/json' : 'text/plain',
    });
    const objectUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${type}_${data.shotNumber || 'asset'}.${type === 'story' || type === 'script' ? 'json' : 'txt'}`;
    link.click();
    window.URL.revokeObjectURL(objectUrl);
  };

  const getTitle = () => {
    if (data.title) return data.title;
    if (data.shotNumber) return `Shot #${data.shotNumber} ${type}`;
    if (type === 'story') return 'Story & Characters';
    if (type === 'character_refs') return 'Character References';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderStoryDetails = () => {
    if (!data.storyDetails) {
      return data.content ? (
        <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
          {data.content}
        </pre>
      ) : null;
    }

    const { theme, tone, acts = [], characters = [], shots = [] } = data.storyDetails;

    const shotsValue = typeof (data.shotsCount ?? shots.length) === 'number'
      ? (data.shotsCount ?? shots.length)
      : undefined;

    return (
      <div className="space-y-6">
        {/* Compact summary line */}
        <div className="flex items-center gap-3 text-sm text-gray-300 border-b border-white/5 pb-4">
          <span className="font-semibold text-white text-base">
            {typeof shotsValue === 'number' ? shotsValue : '—'} Shots
          </span>
          <span className="text-gray-500">·</span>
          <span>{formatDuration(data.totalDurationSeconds)}</span>
          {acts.length > 0 && (
            <>
              <span className="text-gray-500">·</span>
              <span>{acts.length} Acts</span>
            </>
          )}
          {characters.length > 0 && (
            <>
              <span className="text-gray-500">·</span>
              <span>{characters.length} Characters</span>
            </>
          )}
        </div>

        {acts.length > 0 && (
          <Accordion type="single" collapsible defaultValue="acts" className="rounded-xl border border-white/5 bg-black/30">
            <AccordionItem value="acts" className="border-none">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-300 hover:no-underline">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="uppercase tracking-wide">ACTS</span>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-normal">
                    {acts.map((act, index) => (
                      <span key={index}>
                        {index > 0 && <span className="mx-1">→</span>}
                        {act.title}
                      </span>
                    ))}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {acts.map((act, index) => (
                    <div key={`${act.title}-${index}`} className="border-l-2 border-white/10 pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{act.title}</span>
                        <Badge variant="outline" className="border-white/15 text-[10px] text-gray-400">
                          Act {index + 1}
                        </Badge>
                      </div>
                      {act.summary && (
                        <p className="text-sm text-gray-300 leading-relaxed">{act.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {characters.length > 0 && (
          <Accordion type="single" collapsible defaultValue="characters" className="rounded-xl border border-white/5 bg-black/30">
            <AccordionItem value="characters" className="border-none">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-300 hover:no-underline">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="uppercase tracking-wide">MAIN CHARACTERS</span>
                  <div className="flex flex-wrap gap-2">
                    {characters.map((char, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-white/20 text-gray-200 text-xs font-normal"
                      >
                        {char.name || `Character ${index + 1}`}
                        {char.role && <span className="text-gray-400 ml-1">({char.role})</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {characters.map((character, index) => (
                    <div
                      key={`${character.name || index}`}
                      className="border-l-2 border-white/10 pl-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-white">
                          {character.name || `Character ${index + 1}`}
                        </span>
                        {character.role && (
                          <Badge variant="outline" className="border-white/20 text-gray-300 text-[10px]">
                            {character.role}
                          </Badge>
                        )}
                      </div>
                      {character.traits && (
                        <div className="text-sm">
                          <span className="text-gray-500">Traits:</span>{' '}
                          <span className="text-gray-300">{character.traits}</span>
                        </div>
                      )}
                      {character.appearance && (
                        <div className="text-sm">
                          <span className="text-gray-500">Appearance:</span>{' '}
                          <span className="text-gray-300">{character.appearance}</span>
                        </div>
                      )}
                      {character.description && (
                        <p className="text-sm text-gray-300">{character.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {shots.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Shots</h4>
            <Accordion
              type="multiple"
              defaultValue={shots.map((shot, index) => `shot-${shot.number ?? index}`)}
              className="rounded-xl border border-white/5 bg-black/30 divide-y divide-white/5"
            >
              {shots.map((shot, index) => {
                const itemValue = `shot-${shot.number ?? index}`;
                const keyframePromptText = shot.keyframePrompt
                  ? sanitizeKeyframePrompt(shot.keyframePrompt, shot.prompt)
                  : null;
                const videoAttemptsText =
                  shot.videoAttempts && shot.videoAttempts.length > 0
                    ? JSON.stringify(shot.videoAttempts, null, 2)
                    : null;

                return (
                  <AccordionItem
                    key={itemValue}
                    value={itemValue}
                    className="border-none"
                  >
                  <AccordionTrigger className="text-left px-4 py-3 text-gray-100 hover:no-underline">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm">
                        Shot #{shot.number ?? index + 1}
                      </span>
                      {shot.duration && (
                        <Badge variant="outline" className="border-white/15 text-gray-200 text-xs">
                          {formatDuration(shot.duration)}
                        </Badge>
                      )}
                      {shot.keyframeStatus === 'done' && (
                        <Badge variant="outline" className="border-emerald-400/30 text-emerald-300 text-xs">
                          Keyframe Done
                        </Badge>
                      )}
                      {shot.keyframeStatus === 'skipped' && (
                        <Badge variant="outline" className="border-white/15 text-gray-200 text-xs">
                          Keyframe Skipped
                        </Badge>
                      )}
                      {shot.keyframeStatus === 'failed' && (
                        <Badge variant="outline" className="border-rose-400/40 text-rose-300 text-xs">
                          Keyframe Failed
                        </Badge>
                      )}
                      {shot.videoStatus === 'generating' && (
                        <Badge variant="outline" className="border-amber-300/30 text-amber-200 text-xs">
                          Generating
                        </Badge>
                      )}
                      {shot.videoStatus === 'done' && (
                        <Badge variant="outline" className="border-emerald-400/30 text-emerald-300 text-xs">
                          Video Done
                        </Badge>
                      )}
                      {shot.videoStatus === 'failed' && (
                        <Badge variant="outline" className="border-rose-400/40 text-rose-300 text-xs">
                          Video Failed
                        </Badge>
                      )}
                      {shot.videoModelUsed && (
                        <Badge variant="outline" className="border-white/15 text-gray-200 text-xs">
                          Model: {shot.videoModelUsed}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {keyframePromptText && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                              <span>Keyframe Prompt</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-gray-300 hover:bg-white/10"
                                onClick={() => handleCopy(keyframePromptText)}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-black/40 rounded-lg p-3 text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                              {keyframePromptText}
                            </pre>
                          </div>
                        )}
                        {shot.prompt && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                              <span>Shot Prompt</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-gray-300 hover:bg-white/10"
                                onClick={() => handleCopy(shot.prompt)}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="text-sm leading-relaxed text-gray-100 bg-white/5 rounded-lg p-3 whitespace-pre-wrap">
                              {shot.prompt}
                            </pre>
                          </div>
                        )}

                        {(shot.videoErrorMessage || videoAttemptsText) && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                              <span>Video Routing</span>
                              {videoAttemptsText && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-gray-300 hover:bg-white/10"
                                  onClick={() => handleCopy(videoAttemptsText)}
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1" />
                                  Copy Attempts
                                </Button>
                              )}
                            </div>
                            {shot.videoErrorMessage && (
                              <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 whitespace-pre-wrap break-words">
                                {shot.videoErrorMessage}
                              </div>
                            )}
                            {videoAttemptsText && (
                              <pre className="bg-black/40 rounded-lg p-3 text-xs text-gray-100 whitespace-pre-wrap leading-relaxed">
                                {videoAttemptsText}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gray-800 border-gray-700 text-gray-200">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-gray-100">{getTitle()}</DialogTitle>
            {(type === 'script' || type === 'story') && getDownloadableTextContent() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(getDownloadableTextContent() || undefined, true)}
                className="h-8 text-gray-400 hover:text-gray-100 hover:bg-gray-700/50"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            )}
            {(data.url || getDownloadableTextContent()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 text-gray-400 hover:text-gray-100 hover:bg-gray-700/50"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="mt-4 overflow-auto max-h-[calc(90vh-120px)] pr-1 space-y-6">
          {/* Script */}
          {type === 'script' && data.content && (
            <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
              {data.content}
            </pre>
          )}

          {/* Story Details */}
          {type === 'story' && renderStoryDetails()}

          {/* Image */}
          {(type === 'image' || type === 'character_refs') && data.url && (
            <div className="relative flex items-center justify-center bg-gray-900 rounded-lg p-4 min-h-[60vh]">
              {isMediaLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map(index => (
                      <span
                        key={index}
                        className="block w-3 h-3 rounded-full bg-white/60 animate-[agent-loader-bounce_1.2s_ease-in-out_infinite]"
                        style={{ animationDelay: `${index * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <img
                src={data.url}
                alt={getTitle()}
                className="max-w-full max-h-[70vh] object-contain rounded"
                onLoad={() => setIsMediaLoading(false)}
                onError={() => setIsMediaLoading(false)}
                style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
              />
            </div>
          )}

          {/* Video */}
          {type === 'video' && data.url && (
            <div className="relative bg-gray-900 rounded-lg overflow-hidden min-h-[60vh] flex items-center justify-center">
              {isMediaLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map(index => (
                      <span
                        key={index}
                        className="block w-3 h-3 rounded-full bg-white/60 animate-[agent-loader-bounce_1.2s_ease-in-out_infinite]"
                        style={{ animationDelay: `${index * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <video
                src={data.url}
                controls
                autoPlay
                className="w-full max-h-[70vh]"
                preload="auto"
                onLoadedData={() => setIsMediaLoading(false)}
                onError={() => setIsMediaLoading(false)}
                style={{ opacity: isMediaLoading ? 0 : 1, transition: 'opacity 0.3s' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>

        {/* Hint for keyboard shortcuts */}
        {type === 'video' && (
          <div className="text-xs text-gray-500 text-center mt-2">
            Press Space to pause/play • ESC to close
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
