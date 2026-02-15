import { cn } from "@/lib/utils";

interface BetaBadgeProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Beta badge component - displays a small "Beta" label with primary theme color
 * Used across the app for features in beta (e.g., Image Agent, Video Agent)
 */
export function BetaBadge({ className, children = "Beta" }: BetaBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center leading-none text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary text-primary-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
