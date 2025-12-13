"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { BannerSection, Tab } from "@/types/pages/model-landing-page";
import { getMaxPromptLength } from "@/config/image-models";

// 使用默认模型的最大提示词长度（首页 banner 不选择具体模型，使用默认值）
const MAX_PROMPT_LENGTH = getMaxPromptLength("nano-banana");

export default function ModelBanner({ section }: { section: BannerSection }) {
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<string>(
    section.tabs[0]?.value || "text-to-image"
  );
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleGenerate = () => {
    // 找到当前激活的标签页
    const currentTab = section.tabs.find((tab) => tab.value === activeTab);

    if (!currentTab) return;

    if (currentTab.type === "text" && prompt.trim()) {
      localStorage.setItem("modelLandingPagePrompt", prompt);
      router.push(`/${activeTab}`);
    } else if (currentTab.type === "image" && imageFile) {
      // 对于图像文件，我们需要先转换为base64字符串才能存储
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          localStorage.setItem("modelLandingPageImage", e.target.result);
          router.push(`/${activeTab}`);
        }
      };
      reader.readAsDataURL(imageFile);
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
      setError("Please upload a valid image file (JPEG, PNG, GIF, WEBP, JPG)");
      setSelectedImage(null);
      setImageFile(null);
      return;
    }

    // 验证文件大小 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError("File size should not exceed 20MB");
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
    // 重置文件输入元素，解决删除后无法再次上传同一张图片的问题
    const fileInput = document.getElementById(
      "image-upload"
    ) as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // 渲染标签页内容
  const renderTabContent = (tab: Tab) => {
    if (tab.type === "text") {
      return (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">
            {tab.title}
          </h2>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-muted-foreground flex-shrink-0">
              {tab.subTitle}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <img
                  src={tab.modelLogo}
                  alt="Google Nano Banana"
                  className="h-6 w-6 flex-shrink-0"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {tab.modelName}
                </span>
              </div>
            </div>
          </div>

          <Textarea
            placeholder={tab.placeholder}
            className="resize-none bg-input border-border text-foreground placeholder:text-muted-foreground mt-0 overflow-y-auto min-h-[150px] max-h-[300px]"
            value={prompt}
            onChange={(e) => {
              if (e.target.value.length <= MAX_PROMPT_LENGTH) {
                setPrompt(e.target.value);
              }
            }}
            maxLength={MAX_PROMPT_LENGTH}
          />

          <div className="flex justify-end mt-3 text-sm text-muted-foreground">
            <div
              className={`transition-colors duration-300 ${
                prompt.length > 1800
                  ? "text-amber-400"
                  : prompt.length > 1900
                  ? "text-destructive"
                  : ""
              }`}
            >
              {prompt.length} / {MAX_PROMPT_LENGTH}
            </div>
          </div>
        </div>
      );
    } else if (tab.type === "image") {
      return (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">
            {tab.title}
          </h2>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-muted-foreground flex-shrink-0">
              {tab.subTitle}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <img
                  src={tab.modelLogo}
                  alt="Google Nano Banana"
                  className="h-6 w-6 flex-shrink-0"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {tab.modelName}
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

          {/* 上传区域 */}
          <div
            className={`flex justify-center items-center border-2 border-dashed rounded-xl min-h-[150px] max-h-[300px] transition-all duration-300 ${
              isDragging
                ? "border-primary bg-primary/10"
                : selectedImage
                ? "border-green-500"
                : "border-border hover:border-muted"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileClick}
          >
            {selectedImage ? (
              <div className="relative w-full h-full p-2 flex items-center justify-center overflow-hidden">
                <div className="absolute top-2 right-2 z-10 bg-background/80 p-1 rounded-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
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
                  className="max-w-full max-h-[150px] object-contain rounded-lg"
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
                        ? "text-primary scale-110"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {tab.placeholder}
                </p>
              </div>
            )}
          </div>

          {/* 错误消息 */}
          {error && (
            <div className="mt-3 text-sm text-destructive animate-in fade-in-50 duration-300">
              {error}
            </div>
          )}

          {/* 文件格式说明 */}
          {tab.tips && (
            <div className="mt-3 text-sm text-muted-foreground">{tab.tips}</div>
          )}
        </div>
      );
    }
    return null;
  };

  // 渲染创建按钮
  const renderCreateButton = (tab: Tab) => {
    const isDisabled =
      tab.type === "text"
        ? !prompt.trim() || prompt.trim().length > MAX_PROMPT_LENGTH
        : !imageFile;

    return (
      <div className="flex justify-center mt-8">
        <div
          className={`w-full max-w-xs ${
            isDisabled ? "cursor-not-allowed" : ""
          }`}
        >
          <Button
            className={`w-full bg-gradient-to-r ${
              !isDisabled
                ? "from-primary to-primary hover:from-primary hover:to-primary text-primary-foreground font-medium"
                : "from-primary/70 to-primary/70 text-primary-foreground/80 font-medium"
            } py-6 rounded-xl transition-all duration-300 transform ${
              !isDisabled
                ? "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30"
                : ""
            } focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background`}
            disabled={isDisabled}
            onClick={handleGenerate}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-wand-sparkles h-4 w-4 mr-2"
            >
              <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
              <path d="m14 7 3 3"></path>
              <path d="M5 6v4"></path>
              <path d="M19 14v4"></path>
              <path d="M10 2v2"></path>
              <path d="M7 8H3"></path>
              <path d="M21 16h-4"></path>
              <path d="M11 3H9"></path>
            </svg>
            {tab.buttonText}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className='fixed inset-0 -z-10 bg-[url("/imgs/cta-bg.png")] bg-cover bg-center bg-no-repeat'>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>
      <section className="z-1 w-full pt-4 pb-12 md:pt-8 md:pb-16 relative">
        <div className="relative z-10 w-full h-full max-w-4xl mx-auto px-4 md:px-0 flex flex-col items-center">
          <div className="text-center mt-10 mb-6">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground">
              {section.title}
            </h1>
            <p className="text-base text-foreground max-w-5xl">
              {section.description}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border w-full max-w-2xl mx-auto overflow-hidden">
            <Tabs
              defaultValue={section.tabs[0]?.value || "text-to-image"}
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-border bg-muted/30 h-14">
                {section.tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-medium transition-all duration-300 h-full"
                  >
                    {tab.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="p-6 md:p-6">
                {section.tabs.map((tab) => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="mt-0 animate-in fade-in-50 duration-300"
                  >
                    {renderTabContent(tab)}
                    {renderCreateButton(tab)}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </div>
      </section>
    </>
  );
}
