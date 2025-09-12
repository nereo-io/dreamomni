import { Clock, Loader2, CheckCircle, XCircle } from "lucide-react";

export const getStatusMap = (t: any) => ({
  submitted: {
    label: t("status.submitted"),
    color: "bg-blue-500",
    icon: Clock,
  },
  PROMPT_OPTIMIZING: {
    label: t("status.optimizingPrompt"),
    color: "bg-purple-500",
    icon: Loader2,
  },
  IN_QUEUE: { 
    label: t("status.inQueue"), 
    color: "bg-yellow-500", 
    icon: Clock 
  },
  IN_PROGRESS: {
    label: t("status.generating"),
    color: "bg-orange-500",
    icon: Loader2,
  },
  COMPLETED: {
    label: t("status.completed"),
    color: "bg-green-500",
    icon: CheckCircle,
  },
  SAVED_TO_R2: {
    label: t("status.completed"),
    color: "bg-green-500",
    icon: CheckCircle,
  },
  FAILED: { 
    label: t("status.failed"), 
    color: "bg-red-500", 
    icon: XCircle 
  },
});

export const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
    case "SAVED_TO_R2":
      return "bg-green-500";
    case "IN_PROGRESS":
    case "IN_QUEUE":
    case "PROMPT_OPTIMIZING":
      return "bg-blue-500";
    case "FAILED":
      return "bg-red-500";
    default:
      return "bg-yellow-500";
  }
};

export const INCOMPLETE_STATUSES = [
  "submitted",
  "PROMPT_OPTIMIZING",
  "IN_QUEUE",
  "IN_PROGRESS",
];