"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import VideoGenerator from "@/components/blocks/video-generator";
// import HistorySection from "@/components/blocks/history-section";
import { useAppContext } from "@/contexts/app";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import useCredits from "@/hooks/useCredits";
import type { VideoEffect } from "@/types/video-effect";
import type { VideoGenerationParams } from "@/components/blocks/video-generator";
import { Sparkles } from "lucide-react";

interface EffectDetailClientProps {
  effect: VideoEffect;
  locale: string;
}

export default function EffectDetailClient({ effect, locale }: EffectDetailClientProps) {
  const router = useRouter();
  const t = useTranslations("video-generator");
  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const { leftCredits, updateLeftCredits } = useCredits();
  const [enhancedPrompt, setEnhancedPrompt] = useState("");

  const {
    isLoading,
    currentGeneration,
    history,
    isLoadingHistory,
    submitGeneration,
    fetchHistory,
  } = useVideoGeneration();

  // 加载历史记录
  useEffect(() => {
    if (user?.uuid) {
      fetchHistory();
      updateLeftCredits();
    }
  }, [user?.uuid]);

  // 生成带有GPT模板的prompt
  const generateEffectPrompt = useCallback((userPrompt: string) => {
    // 将用户输入替换到模板中
    if (!effect.prompt_template) {
      return userPrompt;
    }
    return effect.prompt_template.replace("{{USER_PROMPT}}", userPrompt);
  }, [effect.prompt_template]);

  // 处理视频生成
  const handleGenerate = useCallback(async (params: VideoGenerationParams) => {
    // 检查用户登录
    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    // 检查积分（特效都需要积分）
    const requiredCredits = effect.credits_required || 10;
    if (!leftCredits || leftCredits < requiredCredits) {
      toast.error(t("toast.insufficientCredits"));
      setShowPricingModal(true);
      return;
    }

    try {
      // 使用特效模板增强prompt
      const effectPrompt = generateEffectPrompt(params.prompt);
      setEnhancedPrompt(effectPrompt);

      // 调用视频生成API，使用增强后的prompt
      await submitGeneration({
        ...params,
        prompt: effectPrompt,
        model: params.model || "volcano-seedance-video", // 默认使用seedance模型
        enable_prompt_enhancement: false, // 特效已经有模板，不需要额外增强
      });

      toast.success(t("toast.generationStarted"));
      
      // 刷新积分和历史记录
      setTimeout(() => {
        updateLeftCredits();
        fetchHistory();
      }, 1000);
    } catch (error) {
      console.error("Video generation failed:", error);
      toast.error(t("toast.generationFailed"));
    }
  }, [
    user?.uuid,
    effect.credits_required,
    leftCredits,
    generateEffectPrompt,
    submitGeneration,
    setShowSignModal,
    setShowPricingModal,
    t,
    updateLeftCredits,
    fetchHistory
  ]);

  // 获取标题和描述
  const title = effect.title || "Video Effect";
  const description = effect.description || "Create amazing video effects with AI";

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            {effect.is_hot && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                HOT
              </span>
            )}
            {effect.credits_required && effect.credits_required > 10 && (
              <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {effect.credits_required} Credits
              </span>
            )}
          </div>
          <p className="text-gray-300 text-lg">{description}</p>
          
          {/* Preview Video */}
          {effect.preview_video && (
            <div className="mt-6 rounded-lg overflow-hidden max-w-md">
              <video
                src={effect.preview_video}
                poster={effect.preview_image || undefined}
                controls
                autoPlay
                loop
                muted
                className="w-full h-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Video Generator */}
          <div className="lg:flex-1">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-semibold text-white">Create Your {title}</h2>
              </div>
              
              <VideoGenerator
                mode="image-to-video"
                onGenerate={handleGenerate}
                isGenerating={isLoading}
                descriptionLabel="Describe your vision"
                descriptionPlaceholder={`Add details to customize your ${title.toLowerCase()}...`}
              />
            </div>
          </div>

          {/* Right: History */}
          <div className="lg:w-[400px]">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Recent Creations</h2>
              
              {/* TODO: Add HistorySection component */}
              <div className="text-gray-400 text-center py-8">
                History will be shown here
              </div>
            </div>
          </div>
        </div>

        {/* SEO Content Section */}
        <div className="mt-12 bg-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">How to Use {title}</h2>
          
          <div className="grid md:grid-cols-3 gap-6 text-gray-300">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">1</div>
              <h3 className="text-lg font-semibold text-white">Upload Your Image</h3>
              <p>Choose a clear photo that you want to transform with the {title.toLowerCase()} effect.</p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">2</div>
              <h3 className="text-lg font-semibold text-white">Customize Your Vision</h3>
              <p>Add details to personalize the effect. Our AI will enhance your description automatically.</p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">3</div>
              <h3 className="text-lg font-semibold text-white">Generate & Download</h3>
              <p>Click generate and wait for your video. Download and share your creation!</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">About This Effect</h3>
            <p className="text-gray-300 leading-relaxed">
              {description} This AI-powered effect uses advanced machine learning to create stunning, 
              realistic videos from your photos. Perfect for social media, creative projects, or just having fun!
            </p>
          </div>

          {/* Technical Details */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Supported Formats</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Image Input: JPEG, PNG, WebP</li>
                <li>• Video Output: MP4 (H.264)</li>
                <li>• Resolution: Up to 1080p</li>
                <li>• Duration: 5-10 seconds</li>
              </ul>
            </div>
            
            <div className="p-6 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Best Practices</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Use high-quality source images</li>
                <li>• Ensure good lighting in photos</li>
                <li>• Clear subject visibility</li>
                <li>• Avoid blurry or pixelated images</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}