/**
 * AgentCreatePanel
 * Left sidebar panel for creating new Agent jobs
 * References: video-generator/index.tsx for layout and structure
 */

"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageGridUploader } from '@/components/blocks/video-generator/ImageGridUploader';
import { AgentPromptVariant, CreateAgentJobRequest } from '@/types/agent';
import { toast } from 'sonner';
import { Loader2, Play } from 'lucide-react';
import { useAppContext } from '@/contexts/app';
import useCredits from '@/hooks/useCredits';
import { getVideoModel } from '@/config/video-models';

const IMAGE_MODELS = [
  { value: 'nano-banana-pro', label: 'Nano Banana Pro', credits: 2 },
  { value: 'nano-banana', label: 'Nano Banana', credits: 2 },
];

const VIDEO_MODELS = [
  { value: 'auto', label: 'Auto (Sora → Veo3 → Seedance)' },
  { value: 'sora-2-image-to-video', label: 'Sora 2' },
  { value: 'kie-veo3-image-to-video', label: 'Veo3' },
  { value: 'byteplus-seedance-1-5-pro-image-to-video', label: 'Seedance Pro' },
];

const PROMPT_VARIANTS: Array<{ value: AgentPromptVariant; label: string }> = [
  { value: 'keyframes_9grid', label: '9-grid keyframes (legacy)' },
  { value: 'current', label: 'Current keyframes' },
  { value: 'direct_video', label: 'Direct video (no keyframes)' },
];

const COST_CONFIG = {
  planReserve: 2, // plan_story_and_shots_node
  roleSceneReference: 2, // design_characters_node (role+scene reference image)
  keyframePerShot: 2, // generate_keyframes_node
  averageShotDuration: 10, // planning target
  spliceCost: 3, // splice_videos_node
};

const DURATIONS = [
  { value: 20, label: '20s' },
  { value: 40, label: '40s' },
  { value: 60, label: '60s' },
];

interface AgentCreatePanelProps {
  onJobCreated?: () => void;
  initialData?: {
    prompt: string;
    referenceImageUrl?: string;
    referenceImageUrls?: string[];
    durationSeconds?: number;
    aspectRatio?: string;
    keyframesEnabled?: boolean;
    promptVariant?: AgentPromptVariant;
    imageModel?: string;
    videoModel?: string;
  };
}

export function AgentCreatePanel({ onJobCreated, initialData }: AgentCreatePanelProps) {
  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const { leftCredits, updateLeftCredits } = useCredits();

  const [prompt, setPrompt] = useState('');
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(20);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [keyframesEnabled, setKeyframesEnabled] = useState<boolean>(true);
  const [promptVariant, setPromptVariant] = useState<AgentPromptVariant>('keyframes_9grid');
  const [imageModel, setImageModel] = useState('nano-banana-pro');
  const [videoModel, setVideoModel] = useState('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when initialData changes (for re-edit)
  useEffect(() => {
    if (initialData) {
      setPrompt(initialData.prompt || '');
      const refs =
        initialData.referenceImageUrls && initialData.referenceImageUrls.length > 0
          ? initialData.referenceImageUrls
          : initialData.referenceImageUrl
          ? [initialData.referenceImageUrl]
          : [];
      setReferenceImageUrls(refs);
      const resolvedPromptVariant: AgentPromptVariant =
        initialData.promptVariant ||
        (initialData.keyframesEnabled === false ? 'current' : 'keyframes_9grid');
      const resolvedKeyframesEnabled =
        resolvedPromptVariant === 'direct_video'
          ? false
          : resolvedPromptVariant === 'keyframes_9grid'
          ? true
          : typeof initialData.keyframesEnabled === 'boolean'
          ? initialData.keyframesEnabled
          : true;

      setDuration(initialData.durationSeconds || 20);
      setAspectRatio(initialData.aspectRatio || '16:9');
      setPromptVariant(resolvedPromptVariant);
      setKeyframesEnabled(resolvedKeyframesEnabled);
      setImageModel(initialData.imageModel || 'nano-banana-pro');
      setVideoModel(initialData.videoModel || 'auto');
    }
  }, [initialData]);

  const getEstimatedVideoDurationPerShot = (selected: string) => {
    if (selected === 'kie-veo3-image-to-video') return 8;
    if (selected === 'byteplus-seedance-1-5-pro-image-to-video') return 12;
    if (selected === 'sora-2-image-to-video') return 15;
    if (selected === 'auto') return 15;
    return 10; // unknown
  };

  const calculateEstimatedCredits = () => {
    const estimatedShots = Math.max(1, Math.ceil(duration / COST_CONFIG.averageShotDuration));
    const planCost = COST_CONFIG.planReserve;
    const roleSceneReferenceCost = COST_CONFIG.roleSceneReference;
    const keyframeCredits = keyframesEnabled ? estimatedShots * COST_CONFIG.keyframePerShot : 0;

    const resolvedVideoModel = videoModel === 'auto' ? 'sora-2-image-to-video' : videoModel;
    const modelConfig = getVideoModel(resolvedVideoModel);
    const perSecondCredits = modelConfig?.perSecondCredits ?? 1.5;
    const perShotDuration = getEstimatedVideoDurationPerShot(resolvedVideoModel);
    const videoCredits = estimatedShots * (perShotDuration * perSecondCredits);
    const spliceCredits = COST_CONFIG.spliceCost;

    return Math.ceil(planCost + roleSceneReferenceCost + keyframeCredits + videoCredits + spliceCredits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a video description');
      return;
    }

    if (prompt.length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    if (prompt.length > 2000) {
      toast.error('Description must not exceed 2000 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: CreateAgentJobRequest = {
        prompt: prompt.trim(),
        reference_image_url: referenceImageUrls[0] || undefined,
        reference_image_urls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
        duration_seconds: duration,
        aspect_ratio: aspectRatio,
        keyframes_enabled: keyframesEnabled,
        prompt_variant: promptVariant,
        image_model: imageModel,
        video_model: videoModel,
      };

      const response = await fetch('/api/agent/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Agent job');
      }

      const data = await response.json();

      toast.success('Agent job created!');

      // Reset form
      setPrompt('');
      setReferenceImageUrls([]);
      setDuration(20);
      setAspectRatio('16:9');
      setKeyframesEnabled(true);
      setPromptVariant('keyframes_9grid');

      // Notify parent to refresh job list
      onJobCreated?.();
    } catch (error: any) {
      console.error('Error creating Agent job:', error);
      toast.error(error.message || 'Failed to create Agent job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedCredits = calculateEstimatedCredits();

  // Update credits after job creation
  useEffect(() => {
    if (!isSubmitting && user?.uuid) {
      const timer = setTimeout(() => {
        updateLeftCredits().catch(console.error);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSubmitting, user?.uuid, updateLeftCredits]);

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg flex flex-col flex-shrink-0 w-full lg:w-[420px] lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]">
      {/* Scrollable content area */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
        <div className="space-y-4 md:space-y-5 px-4 md:px-6 py-4 md:py-5">
          {/* Header Title */}
          <div className="border-b border-gray-700 pb-3">
            <h1 className="text-white text-xl font-semibold">Create Agent Job</h1>
          </div>

          {/* Prompt */}
          <div>
            <div className="text-white text-lg font-semibold mb-4">Description</div>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your video concept, e.g., A cinematic journey through a futuristic city at sunset..."
              className="min-h-[100px] bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-2">
              {prompt.length}/2000 characters
            </p>
          </div>

          {/* Reference Images */}
          <div>
            <ImageGridUploader
              selectedModel={imageModel}
              maxImages={5}
              onImagesChange={setReferenceImageUrls}
              isAuthenticated={!!user?.uuid}
              onShowSignModal={() => setShowSignModal(true)}
              initialImages={referenceImageUrls}
            />
          </div>

          {/* Duration */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-gray-300 text-sm mb-2 block">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9</SelectItem>
                  <SelectItem value="9:16">9:16</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300 text-sm mb-2 block">Duration</Label>
              <Select value={duration.toString()} onValueChange={val => setDuration(Number(val))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* Prompt Variant */}
          <div>
            <Label className="text-gray-300 text-sm mb-2 block">Prompt Variant</Label>
            <Select
              value={promptVariant}
              onValueChange={value => {
                const nextVariant = value as AgentPromptVariant;
                setPromptVariant(nextVariant);
                if (nextVariant === 'direct_video') {
                  setKeyframesEnabled(false);
                } else {
                  setKeyframesEnabled(true);
                }
              }}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_VARIANTS.map(variant => (
                  <SelectItem key={variant.value} value={variant.value}>
                    {variant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Models */}
          <div>
            <div>
              <Label className="text-gray-300 text-sm mb-2 block">Video Model</Label>
              <Select value={videoModel} onValueChange={setVideoModel}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_MODELS.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Credits and Cost */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-gray-300 mb-1">
                  Credits: {leftCredits !== null ? leftCredits : '-'}
                </div>
                <div className="text-gray-300">
                  Cost: {estimatedCredits} ⚡
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setShowPricingModal(true)}
              >
                Recharge
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Unified bottom section */}
      <div className="border-t border-gray-600 bg-gray-900/95 backdrop-blur-sm p-4 md:p-6 mt-auto">
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !prompt.trim() ||
            (leftCredits !== null && leftCredits < estimatedCredits)
          }
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[44px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Generate
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
