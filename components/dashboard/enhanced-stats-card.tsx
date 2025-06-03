import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EnhancedStatsCardProps {
  title: string;
  primaryValue: {
    label: string;
    value: number | string;
    color?: string;
    suffix?: string;
  };
  secondaryValues: {
    label: string;
    value: number | string;
    color?: string;
    suffix?: string;
  }[];
  icon?: React.ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: number;
    label?: string;
  };
  className?: string;
}

export function EnhancedStatsCard({
  title,
  primaryValue,
  secondaryValues,
  icon,
  trend,
  className,
}: EnhancedStatsCardProps) {
  const formatValue = (value: number | string, suffix?: string) => {
    if (typeof value === "number") {
      const formatted = value.toLocaleString();
      return suffix ? `${formatted}${suffix}` : formatted;
    }
    return suffix ? `${value}${suffix}` : value;
  };

  const getTrendColor = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "text-green-500";
      case "down":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getTrendIcon = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "↗";
      case "down":
        return "↘";
      default:
        return "→";
    }
  };

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {/* 主要数值（突出显示） */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {primaryValue.label}
          </div>
          <div
            className={cn(
              "text-3xl font-bold",
              primaryValue.color || "text-foreground"
            )}
          >
            {formatValue(primaryValue.value, primaryValue.suffix)}
          </div>
          {trend && (
            <div
              className={cn(
                "text-sm font-medium mt-1",
                getTrendColor(trend.direction)
              )}
            >
              {getTrendIcon(trend.direction)} {trend.value}%{" "}
              {trend.label && `(${trend.label})`}
            </div>
          )}
        </div>

        {/* 次要数值网格 */}
        {secondaryValues.length > 0 && (
          <div
            className={cn(
              "grid gap-3 pt-3 border-t",
              secondaryValues.length === 1
                ? "grid-cols-1"
                : secondaryValues.length === 2
                ? "grid-cols-2"
                : secondaryValues.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
            )}
          >
            {secondaryValues.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    item.color || "text-foreground"
                  )}
                >
                  {formatValue(item.value, item.suffix)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
