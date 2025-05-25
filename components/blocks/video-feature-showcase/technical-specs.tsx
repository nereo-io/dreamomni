"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { VideoFeature } from "@/types/blocks/video-feature-showcase";
import { BarChart3, Zap, CheckCircle, TrendingUp } from "lucide-react";

interface TechnicalSpecsProps {
  feature: VideoFeature;
}

export function TechnicalSpecs({ feature }: TechnicalSpecsProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h4 className="text-lg font-semibold">Technical Specifications</h4>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {feature.technicalMetrics.map((metric, index) => (
          <Card
            key={index}
            className={`p-4 text-center ${
              metric.highlight
                ? "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800"
                : "bg-gray-50 dark:bg-gray-800"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                {metric.highlight && (
                  <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                )}
                <Badge
                  variant={metric.highlight ? "default" : "secondary"}
                  className="text-xs"
                >
                  {metric.label}
                </Badge>
              </div>

              <div className="text-2xl font-bold text-foreground">
                {metric.value}
                {metric.unit && (
                  <span className="text-sm text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
                )}
              </div>

              {metric.description && (
                <p className="text-xs text-muted-foreground leading-tight">
                  {metric.description}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Indicators */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-muted-foreground">
            Performance Indicators
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Real-time Processing
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Sub-second response time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                High Accuracy
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                98%+ prompt adherence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Scalable Output
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                4K to 8K resolution
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Comparison */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-muted-foreground">
            Industry Benchmark Comparison
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm text-muted-foreground">
              vs. Previous Generation
            </span>
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              +300% faster
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm text-muted-foreground">
              vs. Competing Models
            </span>
            <Badge
              variant="default"
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              #1 in quality
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm text-muted-foreground">
              User Satisfaction Rate
            </span>
            <Badge
              variant="default"
              className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            >
              96% approval
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
