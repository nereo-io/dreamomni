"use client";

import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";

export default function EffectFormPlaceholder() {
  const t = useTranslations("imageEffectTool");

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg flex flex-col flex-shrink-0 w-full lg:w-[420px] lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]">
      {/* Scrollable content area */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
        <div className="space-y-4 md:space-y-5 px-4 md:px-6 py-4 md:py-5">
          {/* Upload placeholder */}
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
            <Upload className="h-10 w-10 text-gray-500 mb-3" />
            <p className="text-sm text-gray-400">
              {t("placeholderText")}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t("comingSoon")}
            </p>
          </div>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="border-t border-gray-600 bg-gray-900/95 backdrop-blur-sm p-4 md:p-6 mt-auto">
        <button
          disabled
          className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-blue-600/50 cursor-not-allowed opacity-60 transition-all"
        >
          {t("generate")}
        </button>
      </div>
    </div>
  );
}
