"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

export interface PromptInspirationItem {
  id: string;
  imageUrl: string;
  prompt: string;
  title?: string;
  inputImageUrl?: string;
  aspectRatio?: string;
  model?: string;
}

interface PromptInspirationGalleryProps {
  items: PromptInspirationItem[];
  onSelect: (item: PromptInspirationItem) => void;
  maxItems?: number;
  showPromptText?: boolean;
  showTitle?: boolean;
  showHeader?: boolean;
}

export function PromptInspirationGallery({
  items,
  onSelect,
  maxItems = 25,
  showPromptText = true,
  showTitle = false,
  showHeader = true,
}: PromptInspirationGalleryProps) {
  const t = useTranslations("imageGenerator");
  const displayedItems = useMemo(
    () => items.slice(0, maxItems),
    [items, maxItems]
  );

  if (displayedItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      {showHeader && (
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-2xl font-semibold text-white">
            {t("promptInspirationTitle")}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {t("promptInspirationSubtitle")}
          </p>
        </div>
      )}

      <div className="columns-1 gap-4 sm:columns-2 md:columns-2 lg:columns-2 xl:columns-3 2xl:columns-3 space-y-4">
        {displayedItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="group relative block w-full overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900/40 transition-all hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/20 break-inside-avoid"
            aria-label={t("useThisPromptAria", { prompt: item.prompt })}
          >
            <div className="relative w-full overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title || item.prompt}
                className="block w-full h-auto transition duration-300 group-hover:scale-[1.05]"
                loading="lazy"
              />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
