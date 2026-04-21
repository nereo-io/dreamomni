/**
 * AgentCreatePanel
 * Left sidebar panel for creating new Agent jobs
 * References: video-generator/index.tsx for layout and structure
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { Loader2, Play, ChevronRight } from 'lucide-react';
import { useAppContext } from '@/contexts/app';
import useCredits from '@/hooks/useCredits';
import { getVideoModel } from '@/config/video-models';
import { calculateImageCredits } from '@/config/image-models';
import { useTranslations } from 'next-intl';
import { CreditsCostSection } from '@/components/blocks/common/CreditsCostSection';

const VIDEO_MODELS = [
  { value: 'byteplus-seedance-1-5-pro-image-to-video', label: 'Seedance Pro' },
  { value: 'kie-veo3-image-to-video', label: 'Veo3' },
];
const DEFAULT_VIDEO_MODEL = VIDEO_MODELS[0].value;

const COST_CONFIG = {
  planReserve: 2, // plan_story_and_shots_node
  bgmCost: 3, // submit_background_music_node (Suno V5)
  averageShotDuration: 10, // planning target
  spliceCost: 1, // splice_videos_node
};

const DURATIONS = [
  { value: 40, label: '40s' },
  { value: 60, label: '60s' },
];

interface AgentCreatePanelProps {
  onJobCreated?: () => void;
  initialData?: {
    prompt: string;
    referenceImageUrls?: string[];
    durationSeconds?: number;
    aspectRatio?: string;
    imageModel?: string;
    videoModel?: string;
  };
}

function normalizeVideoModel(model?: string): string {
  return model && VIDEO_MODELS.some((option) => option.value === model)
    ? model
    : DEFAULT_VIDEO_MODEL;
}

export function AgentCreatePanel({ onJobCreated, initialData }: AgentCreatePanelProps) {
  const t = useTranslations("agentJobs.createPanel");
  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const { leftCredits, updateLeftCredits } = useCredits();

  const [prompt, setPrompt] = useState('');
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(60);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [imageModel, setImageModel] = useState('auto');
  const [videoModel, setVideoModel] = useState(DEFAULT_VIDEO_MODEL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleReferenceImagesChange = useCallback(
    (imageUrls: (string | null)[]) => {
      setReferenceImageUrls(
        imageUrls.filter((url): url is string => !!url)
      );
    },
    []
  );

  // Pre-fill form when initialData changes (for re-edit)
  useEffect(() => {
    if (initialData) {
      setPrompt(initialData.prompt || '');
      const refs =
        initialData.referenceImageUrls && initialData.referenceImageUrls.length > 0
          ? initialData.referenceImageUrls
          : [];
      setReferenceImageUrls(refs);

      setDuration(initialData.durationSeconds || 60);
      setAspectRatio(initialData.aspectRatio || '16:9');
      setImageModel(initialData.imageModel || 'auto');
      setVideoModel(normalizeVideoModel(initialData.videoModel));
    }
  }, [initialData]);

  const getEstimatedVideoDurationPerShot = (selected: string) => {
    if (selected === 'kie-veo3-image-to-video') return 8;
    if (selected === 'byteplus-seedance-1-5-pro-image-to-video') return 10;
    return 10; // unknown
  };

  const calculateEstimatedCredits = () => {
    const estimatedShots = Math.max(1, Math.ceil(duration / COST_CONFIG.averageShotDuration));
    const resolvedImageModelForCredits =
      imageModel === 'seedream'
        ? 'seedream-4-5'
        : imageModel === 'auto'
          ? 'nano-banana-pro'
          : imageModel;
    const perImageCost =
      calculateImageCredits(resolvedImageModelForCredits) ||
      calculateImageCredits('nano-banana-pro');
    const planCost = COST_CONFIG.planReserve;
    const bgmCost = COST_CONFIG.bgmCost;
    const roleSceneReferenceCost = perImageCost * 3;
    const keyframeCredits = estimatedShots * perImageCost;

    const resolvedVideoModel = normalizeVideoModel(videoModel);
    const modelConfig = getVideoModel(resolvedVideoModel);
    const perSecondCredits = modelConfig?.perSecondCredits ?? 1.5;
    const perShotDuration = getEstimatedVideoDurationPerShot(resolvedVideoModel);
    const videoCredits = estimatedShots * (perShotDuration * perSecondCredits);
    const spliceCredits = COST_CONFIG.spliceCost;

    return Math.ceil(
      planCost + bgmCost + roleSceneReferenceCost + keyframeCredits + videoCredits + spliceCredits
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    if (!prompt.trim()) {
      toast.error(t("errorNoDescription"));
      return;
    }

    if (prompt.length < 10) {
      toast.error(t("errorMinLength"));
      return;
    }

    if (prompt.length > 2000) {
      toast.error(t("errorMaxLength"));
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: CreateAgentJobRequest = {
        prompt: prompt.trim(),
        reference_image_urls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
        duration_seconds: duration,
        aspect_ratio: aspectRatio,
        keyframes_enabled: true,
        prompt_variant: 'current',
        image_model: imageModel,
        video_model: normalizeVideoModel(videoModel),
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

      toast.success(t("toastSuccess"));

      // Reset form
      setPrompt('');
      setReferenceImageUrls([]);
      setDuration(60);
      setAspectRatio('16:9');
      setImageModel('auto');
      setVideoModel(DEFAULT_VIDEO_MODEL);

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
  const resolvedImageModelForUploads =
    imageModel === 'seedream'
      ? 'seedream-4-5'
      : imageModel === 'auto'
        ? 'nano-banana-pro'
        : imageModel;

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
            <h1 className="text-white text-xl font-semibold">{t("title")}</h1>
          </div>

          {/* Prompt */}
          <div>
            <div className="text-white text-lg font-semibold mb-4">{t("description")}</div>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
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
              selectedModel={resolvedImageModelForUploads}
              maxImages={5}
              onImagesChange={handleReferenceImagesChange}
              isAuthenticated={!!user?.uuid}
              onShowSignModal={() => setShowSignModal(true)}
              initialImages={referenceImageUrls}
            />
          </div>

          {/* Duration */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-gray-300 text-sm mb-2 block">{t("aspectRatio")}</Label>
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
              <Label className="text-gray-300 text-sm mb-2 block">{t("duration")}</Label>
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

          {/* Models */}
          <div>
            <div>
              <Label className="text-gray-300 text-sm mb-2 block">{t("videoModel")}</Label>
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
          <CreditsCostSection
            leftCredits={leftCredits}
            estimatedCost={estimatedCredits}
            onShowPricing={() => setShowPricingModal(true)}
            labels={{
              credits: t("credits"),
              cost: t("cost"),
              recharge: t("recharge"),
            }}
          />
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
              {t("creating")}
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              {t("generate")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
