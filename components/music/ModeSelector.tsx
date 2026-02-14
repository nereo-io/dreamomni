"use client";

import { useState } from "react";
import { Music as MusicIcon, Disc3 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ModeSelectorProps {
  value: boolean; // instrumental
  onChange: (instrumental: boolean) => void;
  disabled?: boolean;
}

const modes = [
  {
    value: false, // Song mode
    icon: MusicIcon,
    labelKey: "modes.song.label",
    descriptionKey: "modes.song.description",
  },
  {
    value: true, // Instrumental mode
    icon: Disc3,
    labelKey: "modes.instrumental.label",
    descriptionKey: "modes.instrumental.description",
  },
];

export function ModeSelector({
  value,
  onChange,
  disabled = false,
}: ModeSelectorProps) {
  const t = useTranslations("music-generator");

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white text-lg font-semibold">
          {t("mode") || "Mode"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = value === mode.value;

          return (
            <button
              key={mode.value.toString()}
              onClick={() => !disabled && onChange(mode.value)}
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
                    {t(mode.labelKey) || (mode.value ? "Instrumental" : "Song")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t(mode.descriptionKey) || ""}
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
