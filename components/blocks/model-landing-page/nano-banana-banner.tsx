"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app";

interface BannerSection {
  title: string;
  description: string;
  textToImageTab: string;
  imageToImageTab: string;
  promptPlaceholder: string;
  createButtonText: string;
  imageToImageTitle: string;
}

interface NanoBananaBannerProps {
  section: BannerSection;
}

export default function NanoBananaBanner({ section }: NanoBananaBannerProps) {
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("text-to-image");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { user, setShowSignModal } = useAppContext();

  const handleGenerate = () => {
    // 检查用户登陆状态
    if (!user?.uuid) {
      // 未登录，显示登陆弹窗
      setShowSignModal(true);
      return;
    }
    // 已登录，根据当前标签页跳转到对应页面
    if (activeTab === "text-to-image") {
      router.push("/text-to-image");
    } else {
      router.push("/image-to-image");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileClick = () => {
    const fileInput = document.getElementById("image-upload");
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // 验证文件类型
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, WebP, GIF)");
      setSelectedImage(null);
      setImageFile(null);
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size should not exceed 5MB");
      setSelectedImage(null);
      setImageFile(null);
      return;
    }

    // 清除错误
    setError(null);

    // 存储文件
    setImageFile(file);

    // 创建预览URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === "string") {
        setSelectedImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 md:px-0">
      <div className="text-center mb-10">
        <h1
          className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
          style={{ textShadow: "0 2px 10px rgba(139, 92, 246, 0.15)" }}
        >
          {section.title}
        </h1>
        <p className="text-base text-muted-foreground max-w-5xl mx-auto leading-relaxed">
          {section.description}
        </p>
      </div>

      <Tabs
        defaultValue="text-to-image"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-8 p-1 bg-gray-800/50 rounded-xl">
          <TabsTrigger
            value="text-to-image"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
          >
            {section.textToImageTab}
          </TabsTrigger>
          <TabsTrigger
            value="image-to-image"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
          >
            {section.imageToImageTab}
          </TabsTrigger>
        </TabsList>

        <div className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl shadow-purple-900/10">
          <TabsContent
            value="text-to-image"
            className="mt-0 animate-in fade-in-50 duration-300"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                {section.textToImageTab}
              </h2>

              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-300">Prompt</div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <img
                      src="https://videocdn.pollo.ai/web-cdn/pollo/test/cm97uxg1v000m1490lu4pqgla/image/1756783760309-5e0cde26-2d05-44c8-8b53-0bb58d05f252.svg"
                      alt="Google Nano Banana"
                      className="h-6 w-6"
                    />
                    <span className="text-sm text-gray-400">
                      Google Nano Banana
                    </span>
                  </div>
                </div>
              </div>

              <Textarea
                placeholder={section.promptPlaceholder}
                className="min-h-36 bg-gray-950 border-gray-700 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200 resize-y ease-in-out"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />

              <div className="flex justify-end mt-3 text-sm text-muted-foreground">
                <div
                  className={`transition-colors duration-300 ${
                    prompt.length > 1800
                      ? "text-amber-400"
                      : prompt.length > 1900
                      ? "text-red-400"
                      : ""
                  }`}
                >
                  {prompt.length} / 2000
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <Button
                className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-700/30 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                disabled={!prompt.trim()}
                onClick={handleGenerate}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M12 3v3" />
                  <path d="M18.4 5.6a9 9 0 1 1-12.77.04" />
                </svg>
                {section.createButtonText}
              </Button>
            </div>
          </TabsContent>

          <TabsContent
            value="image-to-image"
            className="mt-0 animate-in fade-in-50 duration-300"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                {section.imageToImageTitle}
              </h2>

              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-300">Image</div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <img
                      src="https://videocdn.pollo.ai/web-cdn/pollo/test/cm97uxg1v000m1490lu4pqgla/image/1756783760309-5e0cde26-2d05-44c8-8b53-0bb58d05f252.svg"
                      alt="Google Nano Banana"
                      className="h-6 w-6"
                    />
                    <span className="text-sm text-gray-400">
                      Google Nano Banana
                    </span>
                  </div>
                </div>
              </div>
              {/* 隐藏的文件输入字段 */}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* 上传区域 - 减小高度到h-48 */}
              <div
                className={`flex justify-center items-center border-2 border-dashed rounded-xl h-48 transition-all duration-300 ${
                  isDragging
                    ? "border-purple-500 bg-purple-900/10"
                    : selectedImage
                    ? "border-green-500"
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileClick}
              >
                {selectedImage ? (
                  <div className="relative w-full h-full p-2">
                    <div className="absolute top-2 right-2 z-10 bg-gray-900/80 p-1 rounded-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Remove image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="text-center cursor-pointer group">
                    <div className="flex justify-center mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-all duration-300 ${
                          isDragging
                            ? "text-purple-400 scale-110"
                            : "text-gray-400 group-hover:text-gray-300"
                        }`}
                      >
                        <rect
                          width="18"
                          height="18"
                          x="3"
                          y="3"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground group-hover:text-white transition-colors duration-300">
                      Drag and drop an image here, or click to select
                    </p>
                  </div>
                )}
              </div>

              {/* 错误消息 */}
              {error && (
                <div className="mt-2 text-sm text-red-400 animate-in fade-in-50 duration-300">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-center mt-8">
              <Button
                className={`w-full max-w-xs bg-gradient-to-r ${
                  imageFile
                    ? "from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                    : "from-blue-600/70 to-purple-600/70 text-white/80 font-medium cursor-not-allowed"
                } py-6 rounded-xl transition-all duration-300 transform ${
                  imageFile
                    ? "hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-700/30"
                    : ""
                } focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
                disabled={!imageFile}
                onClick={handleGenerate}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M12 3v3" />
                  <path d="M18.4 5.6a9 9 0 1 1-12.77.04" />
                </svg>
                Create
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
