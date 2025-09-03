import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  statusMap: Record<string, {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }> | null;
  }>;
}

const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, statusMap }) => {
  const statusInfo = statusMap[status] || statusMap.pending;
  const isCompleted = status === "completed" || status === "saved_to_r2";
  const isFailed = status === "failed";
  const isPromptOptimizing = status === "prompt_optimizing";
  const IconComponent = statusInfo.icon;

  return (
    <Badge
      className={cn(
        "text-white text-xs font-semibold px-2.5 py-1 rounded-full border-0 flex-shrink-0 mt-0.5 flex items-center gap-1",
        isCompleted
          ? "bg-green-500 text-white"
          : isFailed
            ? "bg-red-500 text-white"
            : isPromptOptimizing
              ? "bg-purple-500 text-white"
              : "bg-blue-500 text-white"
      )}
    >
      {IconComponent && (
        <IconComponent 
          className={cn(
            "h-3 w-3",
            isPromptOptimizing ? "animate-pulse" : status === "in_progress" || status === "in_queue" ? "animate-spin" : ""
          )} 
        />
      )}
      {statusInfo.label}
    </Badge>
  );
});

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
