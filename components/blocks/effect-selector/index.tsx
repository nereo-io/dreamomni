"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { VideoEffect } from "@/types/video-effect";
import { EffectSelectorModal } from "@/components/blocks/effect-selector-modal";
import { Button } from "@/components/ui/button";

interface EffectSelectorProps {
  current: VideoEffect | null;
  onChange: (effect: VideoEffect | null) => void;
  locale: string;
}

export function EffectSelector({ current, onChange, locale }: EffectSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };
  
  return (
    <>
      {/* 触发按钮 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-200">
          Video Effect (Optional)
        </label>
        
        {current ? (
          // 已选择特效时显示
          <div 
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => setShowModal(true)}
          >
            <img 
              src={current.preview_image || ""} 
              alt={current.title}
              className="w-10 h-10 rounded object-cover"
            />
            <div className="flex-1">
              <p className="text-white font-medium">{current.title}</p>
              <p className="text-sm text-gray-400">
                {current.credits_required} credits
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // 未选择特效时显示选择按钮
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowModal(true)}
            className="w-full justify-start bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Choose Video Effect
          </Button>
        )}
      </div>
      
      {/* 特效选择弹窗 */}
      <EffectSelectorModal
        open={showModal}
        onOpenChange={setShowModal}
        onSelect={onChange}
        locale={locale}
      />
    </>
  );
}