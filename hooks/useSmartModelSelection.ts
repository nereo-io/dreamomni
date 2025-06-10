import { useState, useMemo, useCallback } from "react";
import {
  VideoModelConfig,
  VideoModelType,
  VideoModelProvider,
  getTextToVideoModels,
  getImageToVideoModels,
  calculateCredits,
  getVideoModel,
} from "@/config/video-models";

// 用户选择接口
export interface UserVideoChoices {
  hasImage: boolean;
  aspectRatio: "16:9" | "9:16" | "1:1";
  duration: number;
  needsAudio: boolean;
  qualityPreference?: "fast" | "balanced" | "premium";
}

// 推荐结果接口
export interface ModelRecommendation {
  model: VideoModelConfig;
  credits: number;
  reason: string;
  alternatives: Array<{
    model: VideoModelConfig;
    credits: number;
    reason: string;
  }>;
}

// 智能模型选择 Hook
export default function useSmartModelSelection() {
  const [userChoices, setUserChoices] = useState<UserVideoChoices>({
    hasImage: false,
    aspectRatio: "16:9",
    duration: 5,
    needsAudio: false,
    qualityPreference: "balanced",
  });

  // 获取兼容的模型列表
  const getCompatibleModels = useCallback((choices: UserVideoChoices): VideoModelConfig[] => {
    let availableModels: VideoModelConfig[] = [];

    // 1. 根据输入类型筛选
    if (choices.hasImage) {
      availableModels = getImageToVideoModels();
    } else {
      availableModels = getTextToVideoModels();
    }

    // 2. 根据比例筛选
    availableModels = availableModels.filter(model => 
      model.supportedAspectRatios?.includes(choices.aspectRatio)
    );

    // 3. 根据时长筛选
    availableModels = availableModels.filter(model => {
      if (model.supportedDurations) {
        return model.supportedDurations.includes(choices.duration);
      }
      // Kling 模型的时长兼容性检查
      return choices.duration <= (model.maxDuration || 10);
    });

    // 4. 根据音频需求筛选
    if (choices.needsAudio) {
      availableModels = availableModels.filter(model => model.supportsAudio);
    }

    return availableModels;
  }, []);

  // 计算模型性价比
  const calculateCostEfficiency = useCallback((model: VideoModelConfig, choices: UserVideoChoices): number => {
    const credits = calculateCredits(model.id, choices.duration, choices.needsAudio);
    
    // 基础质量分数
    let qualityScore = 1;
    if (model.provider === VideoModelProvider.VEO3) qualityScore = 3;
    else if (model.provider === VideoModelProvider.VEO2) qualityScore = 2.5;
    else if (model.displayName.includes("Master")) qualityScore = 2.2;
    else if (model.displayName.includes("Pro")) qualityScore = 1.8;
    
    // 功能加分
    if (model.supportsAudio && choices.needsAudio) qualityScore += 0.5;
    if (model.supportedAspectRatios?.includes("1:1")) qualityScore += 0.2;
    
    // 性价比 = 质量分数 / 积分成本
    return qualityScore / credits;
  }, []);

  // 智能推荐算法
  const getRecommendation = useCallback((choices: UserVideoChoices): ModelRecommendation | null => {
    const compatibleModels = getCompatibleModels(choices);
    
    if (compatibleModels.length === 0) {
      return null;
    }

    // 计算每个模型的评分
    const scoredModels = compatibleModels.map(model => ({
      model,
      credits: calculateCredits(model.id, choices.duration, choices.needsAudio),
      costEfficiency: calculateCostEfficiency(model, choices),
    }));

    // 根据用户偏好排序
    let sortedModels = [...scoredModels];
    
    switch (choices.qualityPreference) {
      case "fast":
        // 优先便宜且快速的模型
        sortedModels.sort((a, b) => a.credits - b.credits);
        break;
      case "premium":
        // 优先高质量模型
        sortedModels.sort((a, b) => {
          const aQuality = a.model.provider === VideoModelProvider.VEO3 ? 3 : 
                          a.model.provider === VideoModelProvider.VEO2 ? 2 : 1;
          const bQuality = b.model.provider === VideoModelProvider.VEO3 ? 3 : 
                          b.model.provider === VideoModelProvider.VEO2 ? 2 : 1;
          return bQuality - aQuality;
        });
        break;
      default: // "balanced"
        // 按性价比排序
        sortedModels.sort((a, b) => b.costEfficiency - a.costEfficiency);
    }

    const recommended = sortedModels[0];
    const alternatives = sortedModels.slice(1, 4).map(item => ({
      model: item.model,
      credits: item.credits,
      reason: generateReasonText(item.model, choices),
    }));

    return {
      model: recommended.model,
      credits: recommended.credits,
      reason: generateReasonText(recommended.model, choices),
      alternatives,
    };
  }, [getCompatibleModels, calculateCostEfficiency]);

  // 生成推荐理由
  const generateReasonText = useCallback((model: VideoModelConfig, choices: UserVideoChoices): string => {
    const reasons: string[] = [];

    // 基础匹配
    if (choices.hasImage && model.type === VideoModelType.IMAGE_TO_VIDEO) {
      reasons.push("支持图片输入");
    }
    if (choices.needsAudio && model.supportsAudio) {
      reasons.push("支持音频生成");
    }
    if (choices.aspectRatio === "1:1" && model.supportedAspectRatios?.includes("1:1")) {
      reasons.push("支持1:1比例");
    }

    // 质量特点
    if (model.provider === VideoModelProvider.VEO3) {
      reasons.push("最新技术");
    } else if (model.provider === VideoModelProvider.VEO2) {
      reasons.push("高质量输出");
    } else if (model.displayName.includes("Master")) {
      reasons.push("顶级质量");
    } else if (model.displayName.includes("Pro")) {
      reasons.push("专业品质");
    } else {
      reasons.push("性价比高");
    }

    return reasons.join("，");
  }, []);

  // 检查选择兼容性
  const checkCompatibility = useCallback((choices: UserVideoChoices): {
    isCompatible: boolean;
    issues: string[];
    suggestions: string[];
  } => {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 检查比例兼容性
    if (choices.aspectRatio === "1:1" && choices.needsAudio) {
      issues.push("1:1 比例不支持音频生成");
      suggestions.push("选择 16:9 或 9:16 比例以启用音频功能");
    }

    // 检查图片+音频组合
    if (choices.hasImage && choices.needsAudio) {
      const compatibleModels = getCompatibleModels(choices);
      if (compatibleModels.length === 0) {
        issues.push("当前没有模型支持图片输入+音频生成的组合");
        suggestions.push("取消音频选择或使用文本输入");
      }
    }

    // 检查时长支持
    if (choices.duration > 8 && (choices.needsAudio || choices.hasImage)) {
      issues.push("Veo 模型最大支持 8 秒时长");
      suggestions.push("将时长调整为 8 秒以下或使用 Kling 模型");
    }

    return {
      isCompatible: issues.length === 0,
      issues,
      suggestions,
    };
  }, [getCompatibleModels]);

  // 当前推荐
  const recommendation = useMemo(() => {
    return getRecommendation(userChoices);
  }, [userChoices, getRecommendation]);

  // 兼容性检查
  const compatibility = useMemo(() => {
    return checkCompatibility(userChoices);
  }, [userChoices, checkCompatibility]);

  // 更新用户选择
  const updateChoices = useCallback((updates: Partial<UserVideoChoices>) => {
    setUserChoices(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    userChoices,
    updateChoices,
    recommendation,
    compatibility,
    getCompatibleModels: () => getCompatibleModels(userChoices),
  };
}