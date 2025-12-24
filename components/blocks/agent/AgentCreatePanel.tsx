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
import { CreateAgentJobRequest } from '@/types/agent';
import { toast } from 'sonner';
import { Loader2, Play } from 'lucide-react';
import { useAppContext } from '@/contexts/app';
import useCredits from '@/hooks/useCredits';

const IMAGE_MODELS = [
  { value: 'nano-banana', label: 'Nano Banana', credits: 2 },
];

const VIDEO_MODELS = [
  { value: 'kie-veo3-image-to-video', label: 'Veo3' },
  { value: 'byteplus-seedance-1-5-pro-image-to-video', label: 'Seedance 1.5 Pro' },
];

const COST_CONFIG = {
  planReserve: 2, // plan_story_and_shots_node
  characterRefPerImage: 2, // design_characters_node
  characterRefMax: 2,
  keyframePerShot: 2, // generate_keyframes_node
  averageShotDuration: 8,
  videoCostPerSecond: 1.5, // orchestrate_videos_node
  spliceCost: 3, // splice_videos_node
};

const DURATIONS = [
  { value: 16, label: '16s' },
  { value: 32, label: '32s' },
  { value: 48, label: '48s' },
];

interface AgentCreatePanelProps {
  onJobCreated?: () => void;
  initialData?: {
    prompt: string;
    referenceImageUrl?: string;
    durationSeconds?: number;
    imageModel?: string;
    videoModel?: string;
  };
}

export function AgentCreatePanel({ onJobCreated, initialData }: AgentCreatePanelProps) {
  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const { leftCredits, updateLeftCredits } = useCredits();

  const [prompt, setPrompt] = useState('');
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(16);
  const [imageModel, setImageModel] = useState('nano-banana');
  const [videoModel, setVideoModel] = useState('kie-veo3-image-to-video');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when initialData changes (for re-edit)
  useEffect(() => {
    if (initialData) {
      setPrompt(initialData.prompt || '');
      setReferenceImageUrls(initialData.referenceImageUrl ? [initialData.referenceImageUrl] : []);
      setDuration(initialData.durationSeconds || 16);
      setImageModel(initialData.imageModel || 'nano-banana');
      const normalizedVideoModel =
        initialData.videoModel === 'byteplus-seedance-pro-image-to-video' ||
        initialData.videoModel === 'doubao-seedance-1-0-pro-image-to-video'
          ? 'byteplus-seedance-1-5-pro-image-to-video'
          : initialData.videoModel;
      setVideoModel(normalizedVideoModel || 'kie-veo3-image-to-video');
    }
  }, [initialData]);

  const calculateEstimatedCredits = () => {
    const estimatedShots = Math.max(1, Math.ceil(duration / COST_CONFIG.averageShotDuration));
    const planCost = COST_CONFIG.planReserve;
    const characterReferenceCost =
      referenceImageUrls.length > 0
        ? 0
        : COST_CONFIG.characterRefMax * COST_CONFIG.characterRefPerImage;
    const keyframeCredits = estimatedShots * COST_CONFIG.keyframePerShot;
    const videoCredits = Math.ceil(duration * COST_CONFIG.videoCostPerSecond);
    const spliceCredits = COST_CONFIG.spliceCost;

    return planCost + characterReferenceCost + keyframeCredits + videoCredits + spliceCredits;
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
      setDuration(16);

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

          {/* Models */}
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300 text-sm mb-2 block">Keyframe Model</Label>
              <Select value={imageModel} onValueChange={setImageModel}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_MODELS.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
