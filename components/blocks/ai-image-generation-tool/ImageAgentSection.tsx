'use client';

import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles, Zap, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ImageAgentSectionProps {
  agentMode: boolean;
  onAgentModeChange: (enabled: boolean) => void;
  imageCount: number;
  onImageCountChange: (count: number) => void;
  creditsPerImage: number;
  disabled?: boolean;
}

export default function ImageAgentSection({
  agentMode,
  onAgentModeChange,
  imageCount,
  onImageCountChange,
  creditsPerImage,
  disabled = false,
}: ImageAgentSectionProps) {
  const totalCredits = creditsPerImage * imageCount;

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Image Agent</h3>
              <Badge
                variant="secondary"
                className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0 border-0"
              >
                BETA
              </Badge>
            </div>
            <p className="text-xs text-gray-400">Multi-angle batch generation</p>
          </div>
        </div>
        <Switch
          checked={agentMode}
          onCheckedChange={onAgentModeChange}
          disabled={disabled}
          className="data-[state=checked]:bg-amber-500"
        />
      </div>

      {/* Agent mode content */}
      {agentMode && (
        <div className="space-y-4 mt-4 pt-4 border-t border-gray-700/50">
          {/* Description */}
          <div className="flex items-start gap-2 p-3 bg-gray-900/50 rounded-lg">
            <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-300 leading-relaxed">
              AI will automatically expand your prompt into multiple variations with different angles,
              scenes, and lighting. Perfect for e-commerce product shots or creative exploration.
            </p>
          </div>

          {/* Number of images selection */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 block">
              Number of images
            </label>
            <RadioGroup
              value={imageCount.toString()}
              onValueChange={(v) => onImageCountChange(parseInt(v))}
              className="flex items-center gap-4"
              disabled={disabled}
            >
              {[6, 9, 12].map((count) => (
                <TooltipProvider key={count}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <RadioGroupItem
                          value={count.toString()}
                          id={`agent-count-${count}`}
                          className="border-gray-500 text-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500"
                        />
                        <Label
                          htmlFor={`agent-count-${count}`}
                          className="font-medium text-gray-300 ml-2 cursor-pointer flex items-center gap-1"
                        >
                          {count}
                          <span className="text-xs text-gray-500">images</span>
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-800 border-gray-700">
                      <p className="text-xs">
                        {creditsPerImage} × {count} = {creditsPerImage * count} credits
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </RadioGroup>
          </div>

          {/* Credits summary */}
          <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-gray-300">Total cost</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-amber-400">{totalCredits}</span>
              <span className="text-sm text-gray-400">credits</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
