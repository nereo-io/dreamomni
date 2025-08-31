"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VideoEffectsGrid } from "@/components/blocks/video-effects-grid";
import { VideoEffect } from "@/types/video-effect";
import { useTranslations } from "next-intl";

interface EffectSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (effect: VideoEffect) => void;
  locale: string;
}

export function EffectSelectorModal({
  open,
  onOpenChange,
  onSelect,
  locale,
}: EffectSelectorModalProps) {
  const t = useTranslations("video-generator");
  const [effects, setEffects] = useState<VideoEffect[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载特效数据
  useEffect(() => {
    if (open && effects.length === 0) {
      setLoading(true);
      fetch(`/api/effects/list?locale=${locale}`)
        .then((res) => res.json())
        .then((data) => {
          setEffects(data.effects || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load effects:", err);
          setLoading(false);
        });
    }
  }, [open, locale, effects.length]);

  const handleSelect = (effect: VideoEffect) => {
    onSelect(effect);
    onOpenChange(false); // 选择后关闭弹窗
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="
          /* PC端尺寸 */
          sm:w-[80vw] sm:max-w-6xl sm:h-[80vh] sm:max-h-[800px]
          /* 移动端尺寸 */
          w-[95vw] h-[85vh] max-h-[85vh]
          /* 通用样式 */
          overflow-hidden p-0 
          /* 确保背景是不透明的 - 使用深色背景 */
          bg-gray-900 border-gray-700
          /* 提高z-index避免被sidebar遮挡 */
          !z-[9999]
          /* 布局 */
          flex flex-col
        "
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700 shrink-0">
          <DialogTitle className="text-xl font-semibold text-white">
            Choose Video Effect
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {/* 骨架屏占位符 - 匹配实际布局 */}
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[4/3] bg-gray-700 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="video-effects-modal-grid">
              <VideoEffectsGrid
                effects={effects}
                onSelect={handleSelect}
                showTitle={false} // 弹窗内不显示标题
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}