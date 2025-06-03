import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, CreditCard, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { TargetMetrics } from "@/types/statistics";

interface EnhancedTargetBoardProps {
  targetMetrics: TargetMetrics;
  className?: string;
}

export function EnhancedTargetBoard({
  targetMetrics,
  className,
}: EnhancedTargetBoardProps) {
  // Calculate monthly time progress
  const calculateMonthProgress = () => {
    const now = new Date();
    const currentDay = now.getDate();
    const totalDays = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const progress = Math.min((currentDay / totalDays) * 100, 100);
    return {
      progress,
      currentDay,
      totalDays,
      remainingDays: totalDays - currentDay,
    };
  };

  const timeProgress = calculateMonthProgress();
  const currentMonth = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    if (progress >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProgressStatus = (
    current: number,
    target: number,
    timeProgress: number
  ) => {
    const actualProgress = (current / target) * 100;
    if (actualProgress >= timeProgress + 10) return "ahead";
    if (actualProgress >= timeProgress - 10) return "ontrack";
    return "behind";
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ahead":
        return "Ahead";
      case "ontrack":
        return "On Track";
      case "behind":
        return "Behind";
      default:
        return "On Track";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ahead":
        return "text-green-600 dark:text-green-400";
      case "ontrack":
        return "text-blue-600 dark:text-blue-400";
      case "behind":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const userStatus = getProgressStatus(
    targetMetrics.currentMonthUsers,
    targetMetrics.monthlyUserTarget,
    timeProgress.progress
  );

  const paidUserStatus = getProgressStatus(
    targetMetrics.currentMonthPaidUsers,
    targetMetrics.monthlyPaidUserTarget,
    timeProgress.progress
  );

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardContent className="space-y-6">
        {/* Monthly Time Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Monthly Time Progress</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {timeProgress.progress.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {timeProgress.remainingDays} days remaining
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={timeProgress.progress} className="h-2" />
            <div className="flex justify-end text-xs text-muted-foreground">
              <span>Total {timeProgress.totalDays} days</span>
            </div>
          </div>
        </div>

        {/* New User Target */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">New User Target</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {targetMetrics.userTargetProgress.toFixed(1)}%
              </div>
              <div
                className={cn(
                  "text-xs font-medium",
                  getStatusColor(userStatus)
                )}
              >
                {getStatusText(userStatus)}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {targetMetrics.currentMonthUsers.toLocaleString()} /{" "}
              {targetMetrics.monthlyUserTarget.toLocaleString()}
            </div>
            <Progress
              value={targetMetrics.userTargetProgress}
              className="h-2"
            />
            <div className="flex justify-end text-xs text-muted-foreground">
              <span>
                Needed{" "}
                {(
                  targetMetrics.monthlyUserTarget -
                  targetMetrics.currentMonthUsers
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Paid User Target */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Paid User Target</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {targetMetrics.paidUserTargetProgress.toFixed(1)}%
              </div>
              <div
                className={cn(
                  "text-xs font-medium",
                  getStatusColor(paidUserStatus)
                )}
              >
                {getStatusText(paidUserStatus)}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {targetMetrics.currentMonthPaidUsers.toLocaleString()} /{" "}
              {targetMetrics.monthlyPaidUserTarget.toLocaleString()}
            </div>
            <Progress
              value={targetMetrics.paidUserTargetProgress}
              className="h-2"
            />
            <div className="flex justify-end text-xs text-muted-foreground">
              <span>
                Needed{" "}
                {(
                  targetMetrics.monthlyPaidUserTarget -
                  targetMetrics.currentMonthPaidUsers
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
