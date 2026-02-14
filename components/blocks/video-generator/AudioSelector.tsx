"use client";

import { Switch } from "@/components/ui/switch";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AudioSelectorProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function AudioSelector({
  value,
  onChange,
  disabled = false,
  className,
}: AudioSelectorProps) {
  const t = useTranslations("video-generator");

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span className="text-sm text-gray-300">{t("sound")}</span>
      <div className="flex items-center gap-3">
        <Volume2 className="h-3.5 w-3.5 text-gray-400" />
        <Switch
          checked={value}
          onCheckedChange={onChange}
          disabled={disabled}
          className="data-[state=checked]:bg-primary scale-75"
        />
      </div>
    </div>
  );
}
