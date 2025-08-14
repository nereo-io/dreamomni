import React from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface EnhancedPromptProps {
  originalPrompt: string;
  optimizedPrompt?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const EnhancedPrompt: React.FC<EnhancedPromptProps> = React.memo(({ 
  originalPrompt,
  optimizedPrompt, 
  isExpanded, 
  onToggle 
}) => {
  // Only show if optimized prompt exists and is different from original
  if (!optimizedPrompt || optimizedPrompt === originalPrompt) {
    return null;
  }

  return (
    <div className="bg-gray-900/50 rounded-lg p-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={onToggle}
      >
        <div className="text-sm font-semibold text-purple-400 flex items-center">
          <Sparkles className="text-base mr-2 h-4 w-4" />
          Enhanced Prompt:
        </div>
        {isExpanded ? (
          <ChevronUp className="text-gray-400 h-5 w-5" />
        ) : (
          <ChevronDown className="text-gray-400 h-5 w-5" />
        )}
      </div>
      <p
        className="mt-2 text-sm text-gray-300"
        style={
          isExpanded
            ? {}
            : {
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }
        }
      >
        {optimizedPrompt}
      </p>
    </div>
  );
});

EnhancedPrompt.displayName = "EnhancedPrompt";

export default EnhancedPrompt;