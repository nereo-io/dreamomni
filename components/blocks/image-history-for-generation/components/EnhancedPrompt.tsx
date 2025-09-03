import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { toast } from "sonner";

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
  onToggle,
}) => {
  const hasOptimizedPrompt = optimizedPrompt && optimizedPrompt !== originalPrompt;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Prompt copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy prompt");
    });
  };

  if (!hasOptimizedPrompt) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="text-gray-400 hover:text-white p-0 h-auto font-normal"
      >
        <span className="text-xs">Enhanced Prompt</span>
        {isExpanded ? (
          <ChevronUp className="ml-1 h-3 w-3" />
        ) : (
          <ChevronDown className="ml-1 h-3 w-3" />
        )}
      </Button>

      {isExpanded && (
        <div className="bg-gray-800 rounded-lg p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-300 leading-relaxed flex-1">
              {optimizedPrompt}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(optimizedPrompt)}
              className="text-gray-400 hover:text-white p-1 h-auto"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

EnhancedPrompt.displayName = "EnhancedPrompt";

export default EnhancedPrompt;
