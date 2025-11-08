/**
 * AgentCreateForm
 * Form for creating new Agent video orchestration jobs
 */

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/blocks/video-generator/ImageUploader';
import { CreateAgentJobRequest } from '@/types/agent';
import { toast } from 'sonner';
import { Loader2, Play, Info } from 'lucide-react';
import { useAppContext } from '@/contexts/app';

const IMAGE_MODELS = [
  { value: 'nano-banana', label: 'Nano Banana (Kie.ai)', credits: 2 },
];

const VIDEO_MODELS = [
  { value: 'kie-veo3-image-to-video', label: 'Veo3 (Kie.ai)', creditsPerShot: 50 },
  {
    value: 'doubao-seedance-1-0-pro-image-to-video',
    label: 'Seedance Pro (Volcano)',
    creditsPerShot: 120,
  },
];

const DURATIONS = [
  { value: 16, label: '16 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '60 seconds' },
];

interface AgentCreateFormProps {
  locale: string;
}

export function AgentCreateForm({ locale }: AgentCreateFormProps) {
  const router = useRouter();
  const { user, setShowSignModal } = useAppContext();

  const [prompt, setPrompt] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(16);
  const [imageModel, setImageModel] = useState('nano-banana');
  const [videoModel, setVideoModel] = useState('kie-veo3-image-to-video');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateEstimatedCredits = () => {
    // Rough estimate: 1 shot per 8 seconds
    const estimatedShots = Math.ceil(duration / 8);
    const videoModelInfo = VIDEO_MODELS.find(m => m.value === videoModel);
    const creditsPerShot = videoModelInfo?.creditsPerShot || 50;
    const keyframeCredits = estimatedShots * 2; // 2 credits per keyframe
    const videoCredits = estimatedShots * creditsPerShot;
    return keyframeCredits + videoCredits;
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

    setIsSubmitting(true);

    try {
      const requestBody: CreateAgentJobRequest = {
        prompt: prompt.trim(),
        reference_image_url: referenceImageUrl || undefined,
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

      toast.success('Agent job created successfully!');

      // Navigate to job detail page
      router.push(`/${locale}/agent/${data.job_id}`);
    } catch (error: any) {
      console.error('Error creating Agent job:', error);
      toast.error(error.message || 'Failed to create Agent job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedCredits = calculateEstimatedCredits();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="bg-gray-800 border-gray-700 text-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl">Create Agent Video Job</CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            Describe your video concept and let our AI Agent orchestrate a multi-shot cinematic
            experience
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-gray-200">
                Video Description *
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="E.g., A cinematic journey through a futuristic city at sunset, showcasing flying cars, neon lights, and bustling streets..."
                className="min-h-[120px] bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                maxLength={2000}
              />
              <p className="text-xs text-gray-400">
                {prompt.length}/2000 characters
              </p>
            </div>

            {/* Reference Image (Optional) */}
            <div className="space-y-2">
              <Label className="text-gray-200">Reference Image (Optional)</Label>
              <p className="text-xs text-gray-400 mb-2">
                Upload a reference image to guide the visual style
              </p>
              <ImageUploader
                imageUrl={referenceImageUrl}
                onImageUrlChange={url => setReferenceImageUrl(url)}
                onPixverseImgIdChange={() => {}}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-gray-200">Video Duration *</Label>
              <Select value={duration.toString()} onValueChange={val => setDuration(Number(val))}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
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
              <p className="text-xs text-gray-400">
                The Agent will intelligently split this into multiple shots
              </p>
            </div>

            {/* Model Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Model */}
              <div className="space-y-2">
                <Label className="text-gray-200">Keyframe Generator *</Label>
                <Select value={imageModel} onValueChange={setImageModel}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
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

              {/* Video Model */}
              <div className="space-y-2">
                <Label className="text-gray-200">Video Generator *</Label>
                <Select value={videoModel} onValueChange={setVideoModel}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
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

            {/* Cost Estimate */}
            <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm text-blue-100 font-medium">Estimated Cost</p>
                  <p className="text-xs text-blue-200">
                    Approximately <span className="font-bold">{estimatedCredits} credits</span> for
                    ~{Math.ceil(duration / 8)} shots
                  </p>
                  <p className="text-xs text-gray-400">
                    Final cost depends on the number of shots generated by the AI
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !prompt.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Create Job
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
