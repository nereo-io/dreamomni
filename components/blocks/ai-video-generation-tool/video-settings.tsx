"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins } from "lucide-react";
import useCredits from "@/hooks/useCredits";
import { useEffect } from "react";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";
import {
  getTextToVideoModels,
  getImageToVideoModels,
  getVideoModel,
  calculateCredits,
} from "@/config/video-models";

interface VideoSettingsProps {
  selectedRatio: string;
  setSelectedRatio: (ratio: string) => void;
  selectedDuration: string;
  setSelectedDuration: (duration: string) => void;
  selectedResolution: string;
  setSelectedResolution: (resolution: string) => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  hasImage?: boolean;
  generateAudio?: boolean;
}

export function VideoSettings({
  selectedRatio,
  setSelectedRatio,
  selectedDuration,
  setSelectedDuration,
  selectedResolution,
  setSelectedResolution,
  selectedModel = "",
  setSelectedModel,
  hasImage = false,
  generateAudio = false,
}: VideoSettingsProps) {
  const { leftCredits, updateLeftCredits } = useCredits();
  const { user } = useAppContext();
  const t = useTranslations("video-generator");

  // 用户登录时获取积分
  useEffect(() => {
    if (user?.uuid) {
      updateLeftCredits().catch(console.error);
    }
  }, [user?.uuid, updateLeftCredits]);

  // 获取可用模型
  const availableModels = hasImage
    ? getImageToVideoModels()
    : getTextToVideoModels();
  const selectedModelConfig = getVideoModel(selectedModel);

  // 确保默认选项被选中
  useEffect(() => {
    if (selectedModelConfig) {
      // 设置默认比例（如果当前选择不在支持列表中）
      const supportedRatios = selectedModelConfig.supportedAspectRatios || [
        "16:9",
        "9:16",
        "1:1",
      ];
      if (!supportedRatios.includes(selectedRatio)) {
        setSelectedRatio(supportedRatios[0]);
      }

      // 设置默认时长（如果当前选择不在支持列表中）
      const supportedDurations = selectedModelConfig.supportedDurations || [
        5, 10,
      ];
      const currentDuration = parseInt(selectedDuration.replace("s", ""));
      if (!supportedDurations.includes(currentDuration)) {
        setSelectedDuration(`${supportedDurations[0]}s`);
      }

      // 设置默认分辨率（仅在当前选择不被支持时才设置）
      const supportedResolutions = selectedModelConfig.supportedResolutions || [
        "480p",
        "1080p",
      ];
      if (!supportedResolutions.includes(selectedResolution)) {
        setSelectedResolution(supportedResolutions[0]); // 只有当前选择不被支持时才设置第一个分辨率
      }
    }
  }, [
    selectedModelConfig,
    selectedRatio,
    selectedDuration,
    selectedResolution,
    setSelectedRatio,
    setSelectedDuration,
    setSelectedResolution,
  ]);

  // 模型切换时重置所有设置为默认值
  useEffect(() => {
    if (selectedModelConfig) {
      const supportedRatios = selectedModelConfig.supportedAspectRatios || [
        "16:9",
        "9:16",
        "1:1",
      ];
      const supportedDurations = selectedModelConfig.supportedDurations || [
        5, 10,
      ];
      const supportedResolutions = selectedModelConfig.supportedResolutions || [
        "480p",
        "1080p",
      ];

      // 始终重置为默认值
      setSelectedRatio(supportedRatios[0]);
      setSelectedDuration(`${supportedDurations[0]}s`);
      setSelectedResolution("480p"); // 默认为480p
    }
  }, [selectedModel, setSelectedRatio, setSelectedDuration, setSelectedResolution]);

  // 计算积分消耗
  const currentCreditsRequired = selectedModel
    ? calculateCredits(
        selectedModel,
        parseInt(selectedDuration?.replace("s", "") || "5"),
        generateAudio,
        selectedResolution as any
      )
    : 10;

  return (
    <div>
      <h2 className="text-white text-lg font-semibold mb-4">
        {t("videoSettings")}
      </h2>

      {/* Video Model Selection */}
      <div className="mb-4">
        <label className="text-gray-300 text-sm mb-2 block">
          {t("videoModel")}
        </label>
        {setSelectedModel ? (
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select a model">
                {selectedModelConfig && (
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        selectedModelConfig.id.includes("kling")
                          ? "/imgs/intro/kling.svg"
                          : selectedModelConfig.id.includes("veo")
                          ? "/imgs/intro/veo.svg"
                          : "/imgs/intro/seedance.png"
                      }
                      alt={selectedModelConfig.provider}
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <span className="font-medium">
                      {selectedModelConfig.displayName}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-start gap-3 w-full py-1">
                    <img
                      src={
                        model.id.includes("kling")
                          ? "/imgs/intro/kling.svg"
                          : model.id.includes("veo")
                          ? "/imgs/intro/veo.svg"
                          : "/imgs/intro/seedance.png"
                      }
                      alt={model.provider}
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-100">
                          {model.displayName}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-blue-300">
                          <Coins className="h-3 w-3" />
                          {model.perSecondCredits}/s
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 mb-1 line-clamp-2">
                        {model.description}
                      </span>
                      {model.features && (
                        <div className="flex flex-wrap gap-1">
                          {model.features.map((feature, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center">
            <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded mr-3"></div>
            <span className="text-white">
              {selectedModelConfig?.displayName || "Seedance 1.0 Pro"}
            </span>
          </div>
        )}
      </div>

      {/* Ratio */}
      <div className="mb-4">
        <label className="text-gray-300 text-sm mb-2 block">Ratio</label>
        <div className="flex space-x-6">
          {(
            selectedModelConfig?.supportedAspectRatios || [
              "16:9",
              "9:16",
              "1:1",
            ]
          ).map((ratio) => (
            <label key={ratio} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="ratio"
                value={ratio}
                checked={selectedRatio === ratio}
                onChange={(e) => setSelectedRatio(e.target.value)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border-2 mr-2 ${
                  selectedRatio === ratio
                    ? "border-purple-500 bg-purple-500"
                    : "border-gray-500"
                }`}
              >
                {selectedRatio === ratio && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <span className="text-gray-300">{ratio}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="mb-4">
        <label className="text-gray-300 text-sm mb-2 block">Duration</label>
        <div className="flex space-x-6">
          {(selectedModelConfig?.supportedDurations || [5, 10]).map(
            (duration) => (
              <label
                key={duration}
                className="flex items-center cursor-pointer"
              >
                <input
                  type="radio"
                  name="duration"
                  value={`${duration}s`}
                  checked={selectedDuration === `${duration}s`}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-2 ${
                    selectedDuration === `${duration}s`
                      ? "border-purple-500 bg-purple-500"
                      : "border-gray-500"
                  }`}
                >
                  {selectedDuration === `${duration}s` && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <span className="text-gray-300">{duration}s</span>
              </label>
            )
          )}
        </div>
      </div>

      {/* Resolution */}
      <div className="mb-4">
        <label className="text-gray-300 text-sm mb-2 block">Resolution</label>
        <div className="flex space-x-6">
          {(selectedModelConfig?.supportedResolutions || ["480p", "1080p"]).map(
            (resolution) => (
              <label
                key={resolution}
                className="flex items-center cursor-pointer"
              >
                <input
                  type="radio"
                  name="resolution"
                  value={resolution}
                  checked={selectedResolution === resolution}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-2 ${
                    selectedResolution === resolution
                      ? "border-purple-500 bg-purple-500"
                      : "border-gray-500"
                  }`}
                >
                  {selectedResolution === resolution && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <span className="text-gray-300">{resolution}</span>
              </label>
            )
          )}
        </div>
      </div>

      {/* Credits and Cost */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-gray-300 mb-1">
              Credits: {leftCredits !== null ? leftCredits : "-"}
            </div>
            <div className="text-gray-300">
              Cost: {currentCreditsRequired} ⚡
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => window.open("/pricing", "_blank")}
          >
            Recharge
          </Button>
        </div>
      </div>
    </div>
  );
}
