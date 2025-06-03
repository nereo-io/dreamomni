import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoGenerationStatistics } from "@/types/statistics";

interface VideoGenerationStatsCardProps {
  stats: VideoGenerationStatistics;
  className?: string;
  showYesterdayFirst?: boolean;
}

export function VideoGenerationStatsCard({
  stats,
  className,
  showYesterdayFirst = false,
}: VideoGenerationStatsCardProps) {
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSuccessRateBadgeVariant = (rate: number) => {
    if (rate >= 80) return "default" as const;
    if (rate >= 60) return "secondary" as const;
    return "destructive" as const;
  };

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Video Generation Statistics
        </CardTitle>
        <Video className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Primary Generation Count */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {showYesterdayFirst
              ? "Yesterday's Generation"
              : "Today's Generation"}
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {showYesterdayFirst
              ? stats.yesterdayGenerations.toLocaleString()
              : stats.todayGenerations.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Total: {stats.totalGenerations.toLocaleString()} videos
          </div>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-3 gap-3 mb-4 pt-3 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs font-medium text-muted-foreground">
                Success
              </span>
            </div>
            <div className="text-lg font-semibold text-green-600">
              {showYesterdayFirst
                ? stats.yesterdaySuccessful
                : stats.todaySuccessful}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <XCircle className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-xs font-medium text-muted-foreground">
                Failed
              </span>
            </div>
            <div className="text-lg font-semibold text-red-600">
              {showYesterdayFirst ? stats.yesterdayFailed : stats.todayFailed}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-3 w-3 text-yellow-500 mr-1" />
              <span className="text-xs font-medium text-muted-foreground">
                Processing
              </span>
            </div>
            <div className="text-lg font-semibold text-yellow-600">
              {showYesterdayFirst ? stats.yesterdayPending : stats.todayPending}
            </div>
          </div>
        </div>

        {/* Success Rate Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {showYesterdayFirst
                ? "Yesterday's Success Rate"
                : "Today's Success Rate"}
            </span>
            <Badge
              variant={getSuccessRateBadgeVariant(
                showYesterdayFirst
                  ? stats.yesterdaySuccessRate
                  : stats.todaySuccessRate
              )}
            >
              {showYesterdayFirst
                ? stats.yesterdaySuccessRate
                : stats.todaySuccessRate}
              %
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Weekly Success Rate
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                getSuccessRateColor(stats.weeklySuccessRate)
              )}
            >
              {stats.weeklySuccessRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Overall Success Rate
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                getSuccessRateColor(stats.overallSuccessRate)
              )}
            >
              {stats.overallSuccessRate}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
