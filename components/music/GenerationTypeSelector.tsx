"use client";

import { useTranslations } from "next-intl";
import type { MusicGenerationType } from "@/types/music.d";
import { Music, Mic, Guitar, Upload as UploadIcon } from "lucide-react";

interface GenerationTypeSelectorProps {
  value: MusicGenerationType;
  onChange: (type: MusicGenerationType) => void;
  disabled?: boolean;
}

const generationTypes: Array<{
  value: MusicGenerationType;
  icon: typeof Music;
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    value: "direct",
    icon: Music,
    labelKey: "types.direct.label",
    descriptionKey: "types.direct.description",
  },
  {
    value: "add-vocals",
    icon: Mic,
    labelKey: "types.addVocals.label",
    descriptionKey: "types.addVocals.description",
  },
  {
    value: "add-instrumental",
    icon: Guitar,
    labelKey: "types.addInstrumental.label",
    descriptionKey: "types.addInstrumental.description",
  },
  {
    value: "upload-cover",
    icon: UploadIcon,
    labelKey: "types.uploadCover.label",
    descriptionKey: "types.uploadCover.description",
  },
];

export function GenerationTypeSelector({
  value,
  onChange,
  disabled = false,
}: GenerationTypeSelectorProps) {
  const t = useTranslations("music-generator");

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white text-lg font-semibold">
          {t("generationType") || "Generation Type"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {generationTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;

          return (
            <button
              key={type.value}
              onClick={() => !disabled && onChange(type.value)}
              disabled={disabled}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <Icon
                  className={`h-8 w-8 ${
                    isSelected ? "text-blue-400" : "text-gray-400"
                  }`}
                />
                <div>
                  <p
                    className={`font-medium ${
                      isSelected ? "text-blue-300" : "text-gray-300"
                    }`}
                  >
                    {t(type.labelKey) || type.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t(type.descriptionKey) || ""}
                  </p>
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
