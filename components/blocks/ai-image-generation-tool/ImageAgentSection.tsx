"use client";

import { Switch } from "@/components/ui/switch";
import { BetaBadge } from "@/components/ui/beta-badge";

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
    <div className="transition-all duration-300">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-gray-300 text-sm flex items-center gap-1.5">
          Image Agent
          <BetaBadge />
        </label>
        <Switch
          checked={agentMode}
          onCheckedChange={onAgentModeChange}
          disabled={disabled}
        />
      </div>

      {/* Agent mode content with collapse animation */}
      {agentMode && (
        <div className="pt-1 pb-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Image count</span>
            <div className="flex items-center gap-6">
              {[6, 9, 12].map((count) => (
                <label
                  key={count}
                  className="flex items-center cursor-pointer min-w-0"
                >
                  <input
                    type="radio"
                    name="agent-image-count"
                    value={count}
                    checked={imageCount === count}
                    onChange={() => !disabled && onImageCountChange(count)}
                    className="sr-only"
                    disabled={disabled}
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-2 flex-shrink-0 ${
                      imageCount === count
                        ? "border-primary bg-primary"
                        : "border-gray-500"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {imageCount === count && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <span
                    className={`text-gray-300 text-sm ${
                      disabled ? "opacity-50" : ""
                    }`}
                  >
                    {count}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
