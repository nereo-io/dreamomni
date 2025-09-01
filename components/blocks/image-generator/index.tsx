"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image, Coins, Wand2, Upload, X, Plus, Zap } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import useCredits from "@/hooks/useCredits";
import { 
  IMAGE_GENERATION_TYPES, 
  getModelById, 
  getProviderByModelId,
  calculateRequiredCredits,
  type AIModel 
} from "@/config/aiProviders";

// 图片生成参数接口 - 支持多AI服务提供商
export interface ImageGenerationParams {
  model: string;
  prompt: string;
  mode: "text-to-image" | "image-edit";
  provider?: string; // AI服务提供商
  image_urls?: string[]; // 仅在 image-edit 模式下使用
  negative_prompt?: string;
  aspect_ratio?: string;
  quality?: string;
  style?: string;
  seed?: number;
}

interface ImageGeneratorProps {
  onGenerate: (params: ImageGenerationParams) => Promise<void>;
  isGenerating: boolean;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  onModelChange?: (model: string) => void;
}

// 图片生成功能分类配置已移动到 @/config/aiProviders

// Nano Banana API 只支持 prompt 和 image_urls 参数
// 移除了不支持的参数：aspect_ratio, quality, style, negative_prompt, seed

export default function ImageGenerator({
  onGenerate,
  isGenerating,
  descriptionLabel,
  descriptionPlaceholder = "Describe the image you want to create, e.g., A majestic eagle soaring through mountain peaks at golden hour...",
  onModelChange,
}: ImageGeneratorProps) {
  const { user, setShowSignModal } = useAppContext();
  const { leftCredits, updateLeftCredits, setCredits, isLoading: creditsLoading, hasInitialized } = useCredits();
  
  // 页面加载时主动查询积分
  useEffect(() => {
    if (user?.uuid && !hasInitialized) {
      updateLeftCredits().catch(error => {
        console.error("Failed to fetch credits on mount:", error);
      });
    }
  }, [user?.uuid, hasInitialized]); // 移除 updateLeftCredits 依赖，避免无限循环
  
  // State - 支持功能分类和模型选择
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState<"text-to-image" | "image-to-image">("text-to-image");
  const [selectedModel, setSelectedModel] = useState("google/nano-banana");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  // 获取当前类型的可用模型
  const currentType = IMAGE_GENERATION_TYPES.find(type => type.id === selectedType);
  const availableModels = currentType?.models.filter(model => model.available) || [];
  const currentModel = availableModels.find(model => model.id === selectedModel) || availableModels[0];
  
  // 计算所需积分
  const requiredCredits = currentModel ? calculateRequiredCredits(currentModel.id, { count: 1 }) : 1;
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt, adjustTextareaHeight]);

  // Handle type change
  const handleTypeChange = (type: "text-to-image" | "image-to-image") => {
    setSelectedType(type);
    // 重置图片上传状态
    if (type === "text-to-image") {
      setUploadedImages([]);
      setImageUrls([]);
    }
    // 自动选择该类型下第一个可用模型
    const typeConfig = IMAGE_GENERATION_TYPES.find(t => t.id === type);
    const firstAvailableModel = typeConfig?.models.find(model => model.available);
    if (firstAvailableModel) {
      setSelectedModel(firstAvailableModel.id);
      onModelChange?.(firstAvailableModel.id);
    }
  };

  // Handle model change
  const handleModelChange = (model: string) => {
    // 只允许选择可用的模型
    const modelInfo = currentType?.models.find(m => m.id === model);
    if (modelInfo?.available) {
      setSelectedModel(model);
      onModelChange?.(model);
    }
  };

  // Handle image upload
  const handleImageUpload = async (files: FileList) => {
    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    if (files.length + uploadedImages.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB size limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploadingImages(true);
    const newUrls: string[] = [];

    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResult.code === 0) {
          newUrls.push(uploadResult.data.url);
        } else {
          throw new Error(uploadResult.message || "Upload failed");
        }
      }

      setUploadedImages(prev => [...prev, ...validFiles]);
      setImageUrls(prev => [...prev, ...newUrls]);
      toast.success(`${validFiles.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images. Please try again.");
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Remove uploaded image
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Get selected model info (这行被移除，因为上面已经定义)

  // Handle generation
  const handleGenerate = async () => {
    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter a description for your image");
      return;
    }

    if (selectedType === "image-to-image" && imageUrls.length === 0) {
      toast.error("Please upload at least one image for editing");
      return;
    }

    if (leftCredits !== null && leftCredits < requiredCredits) {
      toast.error(`Insufficient credits. Need ${requiredCredits} credits to generate with this model.`);
      return;
    }

    const provider = getProviderByModelId(selectedModel);
    
    const params: ImageGenerationParams = {
      model: selectedModel,
      prompt: prompt.trim(),
      mode: selectedType === "text-to-image" ? "text-to-image" : "image-edit",
      provider: provider || undefined,
      image_urls: selectedType === "image-to-image" ? imageUrls : undefined,
    };

    try {
      await onGenerate(params);
      
      // 直接减少本地积分显示，避免API调用
      // 生成成功后立即更新本地积分状态
      if (leftCredits !== null && leftCredits >= requiredCredits) {
        setCredits(leftCredits - requiredCredits);
        console.log(`💰 Credits updated locally: ${leftCredits} - ${requiredCredits} = ${leftCredits - requiredCredits}`);
      } else {
        // 如果本地积分状态不准确，才调用API刷新
        setTimeout(() => {
          updateLeftCredits();
        }, 1000);
      }
      
    } catch (error) {
      console.error("Generation error:", error);
      
      // 检查是否是用户同步问题
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("User account synchronization") || 
          errorMessage.includes("sign out and sign in again")) {
        
        // 尝试自动同步用户数据
        try {
          console.log("🔄 Attempting automatic user sync...");
          const syncResponse = await fetch("/api/user/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          
          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            if (syncResult.code === 0) {
              console.log("✅ User sync successful:", syncResult.data.action);
              toast.success("Account synchronized successfully. Please try again.");
              return;
            }
          }
        } catch (syncError) {
          console.error("❌ Auto sync failed:", syncError);
        }
      }
      
      // 显示原始错误
      toast.error(errorMessage || "Generation failed");
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg image-generator-container flex flex-col flex-shrink-0 w-full lg:w-[420px] lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]">
      {/* Scrollable content area */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
        <div className="space-y-4 md:space-y-5 px-4 md:px-6 py-4 md:py-5">
          {/* Function Type Tabs - Simplified */}
          <div className="border-b border-gray-700 -mx-4 md:-mx-6 px-4 md:px-6 mb-4">
            <div className="flex">
              {IMAGE_GENERATION_TYPES.map((type, index) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id as "text-to-image" | "image-to-image")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 relative ${
                    selectedType === type.id
                      ? 'text-blue-400 border-blue-400'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  <span className="font-semibold">{type.name}</span>
                  {/* Active indicator */}
                  {selectedType === type.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-500"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Selection - Simplified Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">AI Model</label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue>
                  {currentModel ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{currentModel.displayName}</span>
                        <span className="text-xs text-gray-400">{currentModel.providerDisplayName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Coins className="h-3 w-3" />
                        <span className="text-xs font-medium">{currentModel.credits}</span>
                      </div>
                    </div>
                  ) : (
                    "Select a model"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {currentType?.models.map((model) => (
                  <SelectItem 
                    key={model.id} 
                    value={model.id} 
                    disabled={!model.available}
                    className="text-white hover:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.displayName}</span>
                          {!model.available && (
                            <span className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded-full">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {model.providerDisplayName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{model.description}</div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 ml-3">
                        <Coins className="h-3 w-3" />
                        <span className="text-xs font-medium">{model.credits}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload (for image-to-image mode) */}
          {selectedType === "image-to-image" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Input Images (up to 5 images)
              </label>
              
              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-500 transition-colors"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  max={5}
                  className="hidden"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                />
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  Click to upload or drag and drop
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Supported formats: JPEG, PNG, WEBP • Maximum file size: 10MB
                </p>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {uploadedImages.length < 5 && (
                    <div 
                      className="w-full h-20 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              )}

              {isUploadingImages && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-400 text-xs mt-1">Uploading images...</p>
                </div>
              )}
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              {selectedType === "image-to-image" 
                ? "Editing Instructions" 
                : (descriptionLabel || "Image Description")
              }
            </label>
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={selectedType === "image-to-image" 
                ? "Describe how you want to edit the image, e.g., Change the background to a sunset scene, add more contrast..."
                : (descriptionPlaceholder || "Describe the image you want to create, e.g., A majestic eagle soaring through mountain peaks at golden hour...")
              }
              className="min-h-[120px] bg-gray-800 border-gray-700 text-white placeholder-gray-400 resize-none overflow-hidden"
              maxLength={1000}
            />
            <div className="text-xs text-gray-400 text-right">
              {prompt.length}/1000
            </div>
          </div>

          {/* 注意：Nano Banana API 仅支持 prompt 和 image_urls 参数 */}
          {/* 所有高级设置（宽高比、质量、风格、负面提示等）都已移除，因为API不支持 */}

          {/* Credits and Cost */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-gray-300 mb-1 flex items-center gap-2">
                  <span>Credits:</span>
                  {creditsLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  ) : (
                    <span className={`font-medium ${
                      leftCredits !== null && leftCredits >= requiredCredits 
                        ? 'text-green-400' 
                        : leftCredits !== null && leftCredits < requiredCredits
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}>
                      {hasInitialized && leftCredits !== null ? leftCredits : "Loading..."}
                    </span>
                  )}
                </div>
                <div className="text-gray-300 flex items-center gap-1">
                  <span>Cost:</span>
                  <span className="text-amber-400 font-medium">{requiredCredits}</span>
                  <Coins className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              {/* 积分状态指示器 */}
              {hasInitialized && leftCredits !== null && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  leftCredits >= requiredCredits 
                    ? 'bg-green-900/20 text-green-400 border border-green-400/20' 
                    : 'bg-red-900/20 text-red-400 border border-red-400/20'
                }`}>
                  {leftCredits >= requiredCredits ? '✓ Sufficient' : '⚠ Insufficient'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom button area */}
      <div className="border-t border-gray-600 bg-gray-900/95 backdrop-blur-sm p-4 md:p-6 mt-auto">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[44px]"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              <span className="truncate">Generating...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              <span className="truncate">
                {selectedType === "image-to-image" ? "Transform Image" : "Generate Image"}
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}