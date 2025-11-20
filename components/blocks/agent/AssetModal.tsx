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
  videoStatus?: string;
}

interface StoryDetails {
  theme?: string;
  tone?: string;
  acts?: StoryAct[];
  characters?: StoryCharacter[];
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

  const handleDownload = () => {
    if (data.url) {
      const link = document.createElement('a');
      link.href = data.url;
      const ext =
        type === 'video'
          ? 'mp4'
          : type === 'image' || type === 'character_refs'
          ? 'png'
          : 'txt';
      link.download = `${type}_${data.shotNumber || 'asset'}.${ext}`;
      link.click();
    }
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
    const summaryCards = [
      { label: 'Theme', value: theme || '—' },
      { label: 'Tone', value: tone || '—' },
      { label: 'Shots', value: typeof shotsValue === 'number' ? shotsValue : '—' },
      { label: 'Total Duration', value: formatDuration(data.totalDurationSeconds) },
    ];

    return (
      <div className="space-y-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(card => (
            <div key={card.label} className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 min-h-[90px] flex flex-col justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-400">{card.label}</p>
              <p className="text-2xl font-semibold text-white">{card.value}</p>
            </div>
          ))}
        </div>

        {acts.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Acts</h4>
            <div className="space-y-3">
              {acts.map((act, index) => (
                <div key={`${act.title}-${index}`} className="rounded-xl border border-white/5 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{act.title}</p>
                      {act.summary && <p className="text-sm text-gray-300 mt-2 leading-relaxed">{act.summary}</p>}
                    </div>
                    <Badge variant="outline" className="border-white/15 text-[11px] text-gray-300">{`Act ${index + 1}`}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {characters.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Main Characters</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {characters.map((character, index) => (
                <div key={`${character.name || index}`} className="rounded-xl border border-white/5 bg-black/30 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-semibold text-white">{character.name || `Character ${index + 1}`}</p>
                    {character.role && (
                      <Badge variant="outline" className="border-white/20 text-gray-200 text-[11px]">
                        {character.role}
                      </Badge>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {character.traits && (
                      <div className="rounded-lg border border-white/5 bg-black/40 p-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">Traits</p>
                        <p className="text-sm text-gray-200 mt-1">{character.traits}</p>
                      </div>
                    )}
                    {character.appearance && (
                      <div className="rounded-lg border border-white/5 bg-black/40 p-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">Appearance</p>
                        <p className="text-sm text-gray-200 mt-1">{character.appearance}</p>
                      </div>
                    )}
                  </div>
                  {character.description && (
                    <p className="text-sm text-gray-300">{character.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {shots.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Shots</h4>
              <p className="text-xs text-gray-400">Click a shot to view prompts and metadata</p>
            </div>
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

                return (
                  <AccordionItem
                    key={itemValue}
                    value={itemValue}
                    className="border-none"
                  >
                  <AccordionTrigger className="text-left px-4 text-gray-100 hover:no-underline">
                    <div className="flex flex-col gap-1 text-sm w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          Shot #{shot.number ?? index + 1}
                        </span>
                        {shot.duration && (
                          <Badge variant="outline" className="border-white/15 text-gray-200">
                            {formatDuration(shot.duration)}
                          </Badge>
                        )}
                        {shot.keyframeStatus && (
                          <Badge variant="outline" className={getStatusBadgeClasses(shot.keyframeStatus)}>
                            Keyframe: {formatStatusLabel(shot.keyframeStatus)}
                          </Badge>
                        )}
                        {shot.videoStatus && (
                          <Badge variant="outline" className={getStatusBadgeClasses(shot.videoStatus)}>
                            Video: {formatStatusLabel(shot.videoStatus)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                    <AccordionContent className="px-4 pb-6">
                      <div className="space-y-5">
                        {keyframePromptText && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                              <span>Keyframe prompt</span>
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
                              <span>Shot prompt</span>
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
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gray-100">{getTitle()}</DialogTitle>
            <div className="flex items-center gap-2">
              {(type === 'script' || (type === 'story' && data.content)) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(undefined, true)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {isCopied ? 'Copied!' : 'Copy'}
                </Button>
              )}
              {data.url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
            </div>
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
            <div className="flex items-center justify-center bg-gray-900 rounded-lg p-4">
              <img
                src={data.url}
                alt={getTitle()}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          )}

          {/* Video */}
          {type === 'video' && data.url && (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <video
                src={data.url}
                controls
                autoPlay
                className="w-full max-h-[70vh]"
                preload="auto"
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
