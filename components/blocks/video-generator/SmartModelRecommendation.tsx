"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Zap, 
  DollarSign, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelRecommendation } from "@/hooks/useSmartModelSelection";
import { VideoModelProvider } from "@/config/video-models";
import { useState } from "react";

interface SmartModelRecommendationProps {
  recommendation: ModelRecommendation | null;
  compatibility: {
    isCompatible: boolean;
    issues: string[];
    suggestions: string[];
  };
  onModelSelect?: (modelId: string) => void;
  className?: string;
}

export default function SmartModelRecommendation({
  recommendation,
  compatibility,
  onModelSelect,
  className,
}: SmartModelRecommendationProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  // 获取提供商图标和样式
  const getProviderBadge = (provider: VideoModelProvider) => {
    switch (provider) {
      case VideoModelProvider.VEO3:
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Veo3
          </Badge>
        );
      case VideoModelProvider.VEO2:
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Zap className="h-3 w-3 mr-1" />
            Veo2
          </Badge>
        );
      case VideoModelProvider.KLING:
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <DollarSign className="h-3 w-3 mr-1" />
            Kling
          </Badge>
        );
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  // 兼容性问题显示
  if (!compatibility.isCompatible) {
    return (
      <Card className={cn("p-4 border-orange-200 bg-orange-50", className)}>
        <Alert className="border-orange-200 bg-transparent">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-orange-800">配置冲突</p>
              <ul className="text-sm space-y-1">
                {compatibility.issues.map((issue, index) => (
                  <li key={index} className="text-orange-700">• {issue}</li>
                ))}
              </ul>
              {compatibility.suggestions.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="font-medium text-orange-800 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    建议
                  </p>
                  <ul className="text-sm space-y-1">
                    {compatibility.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-orange-700">• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  // 无推荐模型
  if (!recommendation) {
    return (
      <Card className={cn("p-4 border-gray-200 bg-gray-50", className)}>
        <div className="text-center py-4">
          <AlertTriangle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">暂无符合条件的模型</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200", className)}>
      {/* 主推荐 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">智能推荐</h4>
            </div>
            {getProviderBadge(recommendation.model.provider)}
          </div>
          
          {onModelSelect && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onModelSelect(recommendation.model.id)}
              className="border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              选择此模型
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h5 className="font-medium text-lg text-gray-900">
              {recommendation.model.displayName}
            </h5>
            <p className="text-sm text-gray-600 mt-1">
              {recommendation.reason}
            </p>
            
            {/* 特性标签 */}
            {recommendation.model.features && (
              <div className="flex flex-wrap gap-1 mt-2">
                {recommendation.model.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-right ml-4">
            <div className="text-xl font-bold text-blue-600">
              {recommendation.credits}积分
            </div>
            <div className="text-xs text-gray-500">
              约 ${(recommendation.credits * 0.025).toFixed(2)} USD
            </div>
          </div>
        </div>

        {/* 其他选项 */}
        {recommendation.alternatives.length > 0 && (
          <Collapsible open={showAlternatives} onOpenChange={setShowAlternatives}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              {showAlternatives ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              查看其他 {recommendation.alternatives.length} 个选项
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              <div className="space-y-2 pt-2 border-t border-blue-100">
                {recommendation.alternatives.map((alt, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-white/70 border border-blue-100">
                    <div className="flex items-center gap-2">
                      {getProviderBadge(alt.model.provider)}
                      <div>
                        <div className="font-medium text-sm">{alt.model.displayName}</div>
                        <div className="text-xs text-gray-600">{alt.reason}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">{alt.credits}积分</div>
                        <div className="text-xs text-gray-500">
                          ${(alt.credits * 0.025).toFixed(2)}
                        </div>
                      </div>
                      
                      {onModelSelect && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onModelSelect(alt.model.id)}
                          className="text-blue-600 hover:bg-blue-100"
                        >
                          选择
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </Card>
  );
}