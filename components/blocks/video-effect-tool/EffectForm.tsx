"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import useCredits from "@/hooks/useCredits";
import { CreditsCostSection } from "@/components/blocks/common/CreditsCostSection";
import { CaptchaModal } from "@/components/ui/captcha-modal";
import { ImageUploader } from "@/components/blocks/video-generator/ImageUploader";
import type { VideoEffectFormConfig } from "@/types/blocks/video-effect-tool";
import { calculateEffectCredits } from "@/config/effect-models";

interface EffectFormProps {
  config: VideoEffectFormConfig;
  effectId: string;
  isGenerating: boolean;
  onGenerate: (params: EffectGenerationParams) => Promise<void>;
}

export interface EffectGenerationParams {
  effectId: string;
  imageUrls: string[];
  settings: Record<string, string>;
  captchaToken?: string;
}

export default function EffectForm({
  config,
  effectId,
  isGenerating,
  onGenerate,
}: EffectFormProps) {
  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const locale = useLocale();
  const t = useTranslations("videoEffectTool");
  const { leftCredits, updateLeftCredits } = useCredits();

  // Settings state — initialize from defaults
  const [settingsValues, setSettingsValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      for (const setting of config.settings) {
        initial[setting.key] = setting.defaultValue || setting.options[0]?.value || "";
      }
      return initial;
    }
  );

  // Reactive credit calculation based on current settings
  const estimatedCredits = useMemo(() => {
    return calculateEffectCredits(effectId, settingsValues);
  }, [effectId, settingsValues]);

  // Image upload state
  const [uploadedImageUrls, setUploadedImageUrls] = useState<(string | null)[]>(
    []
  );
  const [sourceImageIds, setSourceImageIds] = useState<(string | null)[]>([]);

  // CAPTCHA state
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [pendingParams, setPendingParams] = useState<EffectGenerationParams | null>(null);

  const isAuthenticated = !!user?.uuid;
  const minImages = config.minImages ?? 1;

  const handleImagesChange = useCallback(
    (urls: (string | null)[], sourceIds?: (string | null)[]) => {
      setUploadedImageUrls(urls);
      if (sourceIds) {
        setSourceImageIds(sourceIds);
      }
    },
    []
  );

  // Fetch credits on mount
  useEffect(() => {
    if (user?.uuid) {
      updateLeftCredits().catch(console.error);
    }
  }, [user?.uuid, updateLeftCredits]);

  // Refresh credits after generation completes
  useEffect(() => {
    if (!isGenerating && user?.uuid) {
      const timer = setTimeout(() => {
        updateLeftCredits().catch(console.error);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, user?.uuid, updateLeftCredits]);

  const needsCaptcha = useCallback(() => {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      return false;
    }
    return user?.uuid && leftCredits !== null && leftCredits <= 12;
  }, [user?.uuid, leftCredits]);

  const handleSettingChange = useCallback((key: string, value: string) => {
    setSettingsValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCaptchaComplete = async (captchaToken: string) => {
    if (pendingParams) {
      const finalParams = { ...pendingParams, captchaToken };
      setShowCaptchaModal(false);
      setPendingParams(null);
      await onGenerate(finalParams);
    }
  };

  const handleGenerate = async () => {
    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    const uploadedUrls = uploadedImageUrls
      .filter((url): url is string => !!url);

    if (uploadedUrls.length < minImages) {
      toast.error(
        minImages > 1
          ? t("uploadRequiredCount", { count: minImages })
          : t("uploadRequired")
      );
      return;
    }

    if (leftCredits !== null && leftCredits < estimatedCredits) {
      toast.error(t("insufficientCredits"));
      return;
    }

    const params: EffectGenerationParams = {
      effectId,
      imageUrls: uploadedUrls,
      settings: settingsValues,
    };

    if (needsCaptcha()) {
      setPendingParams(params);
      setShowCaptchaModal(true);
      return;
    }

    await onGenerate(params);
  };

  const hasRequiredImages =
    uploadedImageUrls.filter((url) => !!url).length >= minImages;
  const backHref = locale === "en" ? "/video-effect" : `/${locale}/video-effect`;

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg flex flex-col flex-shrink-0 w-full lg:w-[420px] lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]">
      {/* Scrollable content area */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
        <div className="space-y-4 md:space-y-5 px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href={backHref}>
                <ChevronLeft className="h-4 w-4" />
                {t("backToEffects")}
              </Link>
            </Button>
          </div>

          {/* 1. Title Container with background image */}
          <div className="relative aspect-video rounded-xl overflow-hidden">
            <img
              src={config.backgroundImage}
              alt={config.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative flex items-center justify-center h-full px-4">
              <h1 className="text-white text-xl md:text-2xl font-bold text-center drop-shadow-lg">
                {config.title}
              </h1>
            </div>
          </div>

          {/* 2. Image Upload */}
          <div>
            <ImageUploader
              selectedModel=""
              maxImages={config.maxImages}
              onImagesChange={handleImagesChange}
              imageUrls={uploadedImageUrls}
              sourceImageIds={sourceImageIds}
              isAuthenticated={isAuthenticated}
              onShowSignModal={() => setShowSignModal(true)}
            />
          </div>

          {/* 3. Settings */}
          {config.settings.length > 0 && (
            <div>
              <div className="text-white text-lg font-semibold mb-4">
                {t("settings")}
              </div>
              {config.settings.map((setting) => (
                <div key={setting.key} className="mb-4">
                  <label className="text-gray-300 text-sm mb-2 block">
                    {setting.label}
                  </label>
                  <div className="flex flex-wrap gap-3 sm:gap-6">
                    {setting.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center cursor-pointer min-w-0"
                      >
                        <input
                          type="radio"
                          name={`effect-setting-${setting.key}`}
                          value={option.value}
                          checked={settingsValues[setting.key] === option.value}
                          onChange={() =>
                            handleSettingChange(setting.key, option.value)
                          }
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-2 flex-shrink-0 ${
                            settingsValues[setting.key] === option.value
                              ? "border-primary bg-primary"
                              : "border-gray-500"
                          }`}
                        >
                          {settingsValues[setting.key] === option.value && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                          )}
                        </div>
                        <span className="text-gray-300 text-sm">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. Credits & Cost */}
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

      {/* 5. Fixed Generate button */}
      <div className="border-t border-gray-600 bg-gray-900/95 backdrop-blur-sm p-4 md:p-6 mt-auto">
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              !hasRequiredImages ||
              (leftCredits !== null &&
                leftCredits < estimatedCredits)
            }
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[44px]"
        >
          {isGenerating ? (
            <>
              <Play className="mr-2 h-4 w-4 animate-spin" />
              <span className="truncate">{t("generating")}</span>
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              <span className="truncate">{t("generate")}</span>
            </>
          )}
        </Button>
      </div>

      {/* CAPTCHA Modal */}
      <CaptchaModal
        isOpen={showCaptchaModal}
        onClose={() => {
          setShowCaptchaModal(false);
          setPendingParams(null);
        }}
        onCaptchaComplete={handleCaptchaComplete}
        isSubmitting={isGenerating}
      />
    </div>
  );
}
