"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronLeft, Play, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import useCredits from "@/hooks/useCredits";
import { useImageUpload } from "@/hooks/useImageUpload";
import { CreditsCostSection } from "@/components/blocks/common/CreditsCostSection";
import { CaptchaModal } from "@/components/ui/captcha-modal";
import { ImageSelectionModal, type SelectedImage } from "@/components/blocks/video-generator/ImageSelectionModal";
import type { EffectFormConfig } from "@/types/blocks/image-effect-tool";
import { calculateEffectCredits } from "@/config/effect-models";

interface EffectFormProps {
  config: EffectFormConfig;
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
    const computed = calculateEffectCredits(effectId, settingsValues);
    return computed > 0 ? computed : config.baseCredits;
  }, [effectId, settingsValues, config.baseCredits]);

  // Image upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // CAPTCHA state
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [pendingParams, setPendingParams] = useState<EffectGenerationParams | null>(null);

  const isAuthenticated = !!user?.uuid;

  const handleImagesChange = useCallback(
    (urls: (string | null)[]) => {
      // no-op — useImageUpload manages internal state
    },
    []
  );

  const { imageSlots, uploadImage, removeImage, addUrls } = useImageUpload({
    maxImages: config.maxImages,
    selectedModel: "",
    isAuthenticated,
    onShowSignModal: () => setShowSignModal(true),
    onImagesChange: handleImagesChange,
  });

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
    return user?.uuid && leftCredits !== null && leftCredits <= 12;
  }, [user?.uuid, leftCredits]);

  const handleSettingChange = useCallback((key: string, value: string) => {
    setSettingsValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadImage(files[0], 0);
    }
  };

  const handleSelectFromCreations = useCallback(
    (selections: SelectedImage[]) => {
      if (selections.length === 0) return;
      const first = selections[0];
      addUrls([first.url], [first.id]);
    },
    [addUrls]
  );

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

    const uploadedUrls = imageSlots
      .map((slot) => slot.url)
      .filter((url): url is string => !!url);

    if (uploadedUrls.length === 0) {
      toast.error("Please upload an image to apply the effect.");
      return;
    }

    if (leftCredits !== null && leftCredits < estimatedCredits) {
      toast.error("Insufficient credits. Please recharge.");
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

  const slot = imageSlots[0];
  const hasImage = !!slot?.url;
  const backHref = locale === "en" ? "/image-effect" : `/${locale}/image-effect`;

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg flex flex-col flex-shrink-0 w-full lg:w-[420px] lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]">
      {/* Scrollable content area */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
        <div className="space-y-4 md:space-y-5 px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href={backHref}>
                <ChevronLeft className="h-4 w-4" />
                Back to Image Effects
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
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white text-lg font-semibold">
                Upload Image
              </span>
            </div>

            {!hasImage ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  slot?.isUploading ? "cursor-not-allowed" : "cursor-pointer"
                } ${
                  isDragOver
                    ? "border-blue-400 bg-blue-900/50"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                onDragOver={!slot?.isUploading ? handleDragOver : undefined}
                onDragLeave={!slot?.isUploading ? handleDragLeave : undefined}
                onDrop={!slot?.isUploading ? handleDrop : undefined}
                onClick={() =>
                  !slot?.isUploading &&
                  document.getElementById("effect-image-upload")?.click()
                }
              >
                {slot?.isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent mb-4" />
                    <p className="text-sm text-blue-300">Uploading image...</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <ImageIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text text-gray-300">
                        Drag & drop or click to upload
                      </p>
                      {isAuthenticated && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsModalOpen(true);
                          }}
                          className="text-gray-500 underline text-sm hover:text-blue-400 mt-1"
                        >
                          Select from My Creations
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, 0);
                  }}
                  className="hidden"
                  id="effect-image-upload"
                />
              </div>
            ) : null}

            {!hasImage && (
              <p className="text-xs text-gray-400 mt-2">
                Supports JPG, PNG, WebP (max 10MB)
              </p>
            )}

            {hasImage && (
              <div className="relative">
                <img
                  src={slot.url!}
                  alt="Uploaded"
                  className="w-full h-32 object-contain rounded-lg bg-gray-800"
                />
                {!slot.isUploading && (
                  <button
                    onClick={() => removeImage(0)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {slot.isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                      <span className="text-white text-sm">Uploading...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Settings */}
          {config.settings.length > 0 && (
            <div>
              <div className="text-white text-lg font-semibold mb-4">
                Settings
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
              credits: "Credits",
              cost: "Cost",
              recharge: "Recharge",
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
            !hasImage ||
            (leftCredits !== null &&
              leftCredits < estimatedCredits)
          }
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[44px]"
        >
          {isGenerating ? (
            <>
              <Play className="mr-2 h-4 w-4 animate-spin" />
              <span className="truncate">Generating...</span>
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              <span className="truncate">Generate</span>
            </>
          )}
        </Button>
      </div>

      {/* Image Selection Modal */}
      <ImageSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectFromCreations}
        maxSelection={config.maxImages}
        currentCount={imageSlots.filter((s) => !!s.url).length}
      />

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
