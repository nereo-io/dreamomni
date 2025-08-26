"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { VideoEffect } from "@/types/video-effect";

interface EffectSelectorProps {
  current: VideoEffect;
  effects: VideoEffect[];
  onChange: (effect: VideoEffect) => void;
}

export function EffectSelector({ current, effects, onChange }: EffectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-gray-800 rounded-lg p-3 mb-4">
      {/* Current selected effect */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <img 
            src={current.preview_image || ""} 
            alt={current.title}
            className="w-10 h-10 rounded object-cover"
          />
          <span className="text-white font-medium">{current.title}</span>
        </div>
        <ChevronRight 
          className={`w-5 h-5 text-gray-400 transform transition-transform ${
            isOpen ? 'rotate-90' : ''
          }`} 
        />
      </div>
      
      {/* Effect list */}
      {isOpen && (
        <div className="mt-3 space-y-2">
          {effects.map(effect => (
            <div
              key={effect.id}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                effect.id === current.id 
                  ? 'bg-gray-700' 
                  : 'hover:bg-gray-700'
              }`}
              onClick={() => {
                onChange(effect);
                setIsOpen(false);
              }}
            >
              <img 
                src={effect.preview_image || ""} 
                alt={effect.title}
                className="w-8 h-8 rounded object-cover" 
              />
              <span className="text-gray-300">{effect.title}</span>
              {effect.id === current.id && (
                <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}