import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  statusMap: Record<string, {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, statusMap }) => {
  const statusInfo = statusMap[status] || statusMap.submitted;
  const isCompleted = status === "COMPLETED" || status === "SAVED_TO_R2";
  const isFailed = status === "FAILED";

  return (
    <Badge
      className={cn(
        "text-white text-xs font-semibold px-2.5 py-1 rounded-full border-0 flex-shrink-0 mt-0.5",
        isCompleted
          ? "bg-green-500 text-green-900"
          : isFailed
            ? "bg-red-500 text-red-900"
            : "bg-blue-500 text-blue-900"
      )}
    >
      {statusInfo.label}
    </Badge>
  );
});

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;