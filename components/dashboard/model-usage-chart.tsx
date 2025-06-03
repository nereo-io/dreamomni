import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cpu, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelUsageStatistics } from "@/types/statistics";

interface ModelUsageChartProps {
  modelStats: ModelUsageStatistics[];
  className?: string;
}

export function ModelUsageChart({
  modelStats,
  className,
}: ModelUsageChartProps) {
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 80) return "text-blue-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getSuccessRateBadgeVariant = (rate: number) => {
    if (rate >= 90) return "default" as const;
    if (rate >= 80) return "secondary" as const;
    if (rate >= 70) return "outline" as const;
    return "destructive" as const;
  };

  const getModelDisplayName = (modelId: string) => {
    // Convert model ID to friendly display name
    const modelMap: { [key: string]: string } = {
      "kling-1-6": "Kling 1.6",
      "kling-1-5": "Kling 1.5",
      runwayml: "Runway ML",
      "pika-labs": "Pika Labs",
      "stable-video": "Stable Video",
      "gen-2": "Gen-2",
    };
    return modelMap[modelId] || modelId;
  };

  const totalUsage = modelStats.reduce(
    (sum, model) => sum + model.totalUsage,
    0
  );
  const topModel = modelStats[0]; // Assuming sorted by usage

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium">
          AI Model Usage Statistics
        </CardTitle>
        <Cpu className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Overview Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Total Usage
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {totalUsage.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Active Models
            </div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {modelStats.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Top Model
            </div>
            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {topModel ? getModelDisplayName(topModel.modelName) : "None"}
            </div>
          </div>
        </div>

        {/* Detailed Model List */}
        <div className="space-y-4">
          {modelStats.map((model, index) => (
            <div
              key={model.modelName}
              className="space-y-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Model Name and Ranking */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium">
                    {getModelDisplayName(model.modelName)}
                  </span>
                  {index === 0 && (
                    <Badge variant="default" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {model.usagePercentage}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Market Share
                  </div>
                </div>
              </div>

              {/* Usage Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Usage: {model.totalUsage.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    Today: {model.todayUsage}
                  </span>
                </div>
                <Progress value={model.usagePercentage} className="h-2" />
              </div>

              {/* Success Rate and Statistics */}
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">Success Rate</div>
                  <Badge
                    variant={getSuccessRateBadgeVariant(model.successRate)}
                    className="text-xs"
                  >
                    {model.successRate}%
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">Success</div>
                  <div className="font-medium text-green-600 dark:text-green-400">
                    {model.successCount.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">Failed</div>
                  <div className="font-medium text-red-600 dark:text-red-400">
                    {model.failureCount.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">Today Usage</div>
                  <div className="font-medium text-blue-600 dark:text-blue-400">
                    {model.todayUsage}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {modelStats.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No model usage data available</p>
          </div>
        )}

        {/* Performance Insights */}
        {topModel && (
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Performance Insights
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {getModelDisplayName(topModel.modelName)} is currently the most
              popular model with a success rate of {topModel.successRate}%.
              Consider focusing on its performance optimization.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
