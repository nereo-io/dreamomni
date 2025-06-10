"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Volume2, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

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
  const t = useTranslations("audio-selector");

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        <Volume2 className="h-4 w-4 text-gray-400" />
        <div className="flex items-center gap-2">
          <Label htmlFor="audio-toggle" className="text-gray-200 font-medium">
            {t("sound")}
          </Label>
          <Info className="h-3 w-3 text-gray-500" />
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
            {t("veo3Only")}
          </Badge>
        </div>
      </div>
      
      <Switch
        id="audio-toggle"
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
        className="data-[state=checked]:bg-orange-500"
      />
    </div>
  );
}