"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Film, Music } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MediaItem } from "./MediaGridUploader";

interface PromptWithMentionsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  mediaItems: MediaItem[];
  className?: string;
}

function getMentionIcon(type: string) {
  switch (type) {
    case "video":
      return <Film className="h-4 w-4 text-blue-400" />;
    case "audio":
      return <Music className="h-4 w-4 text-green-400" />;
    default:
      return <ImageIcon className="h-4 w-4 text-gray-400" />;
  }
}

export function PromptWithMentions({
  value,
  onChange,
  placeholder,
  disabled,
  mediaItems,
  className,
}: PromptWithMentionsProps) {
  const t = useTranslations("video-generator");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionCursorPos, setMentionCursorPos] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const mentionLabels = (() => {
    const counts = { image: 0, video: 0, audio: 0 };
    return mediaItems.map((item) => {
      counts[item.type as keyof typeof counts] =
        (counts[item.type as keyof typeof counts] || 0) + 1;
      const typeLabel =
        item.type === "image"
          ? t("mediaTypeImage")
          : item.type === "video"
            ? t("mediaTypeVideo")
            : t("mediaTypeAudio");
      return `${typeLabel}${counts[item.type as keyof typeof counts]}`;
    });
  })();

  const adjustHeight = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(Math.max(element.scrollHeight, 150), 300)}px`;
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      setTimeout(adjustHeight, 0);

      const cursorPos = e.target.selectionStart ?? 0;
      const charBefore = newValue[cursorPos - 1];
      if (charBefore === "@" && mediaItems.length > 0) {
        setShowDropdown(true);
        setMentionCursorPos(cursorPos);
        setActiveIndex(0);
      } else if (showDropdown) {
        const textBeforeCursor = newValue.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");
        if (lastAtIndex === -1 || lastAtIndex < (mentionCursorPos ?? 0) - 1) {
          setShowDropdown(false);
          setMentionCursorPos(null);
        }
      }
    },
    [adjustHeight, mediaItems.length, mentionCursorPos, onChange, showDropdown]
  );

  const insertMention = useCallback(
    (index: number) => {
      if (mentionCursorPos === null || !textareaRef.current) return;

      const label = `@${index + 1} `;
      const before = value.slice(0, mentionCursorPos - 1);
      const after = value.slice(mentionCursorPos);
      const newValue = before + label + after;

      onChange(newValue);
      setShowDropdown(false);
      setMentionCursorPos(null);

      setTimeout(() => {
        const element = textareaRef.current;
        if (element) {
          element.focus();
          const newPos = before.length + label.length;
          element.setSelectionRange(newPos, newPos);
          adjustHeight();
        }
      }, 0);
    },
    [adjustHeight, mentionCursorPos, onChange, value]
  );

  const scrollActiveIntoView = useCallback((index: number) => {
    const container = dropdownRef.current;
    if (!container) return;
    const items = container.querySelectorAll("[data-mention-item]");
    items[index]?.scrollIntoView({ block: "nearest" });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = (activeIndex + 1) % mediaItems.length;
          setActiveIndex(next);
          scrollActiveIntoView(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = (activeIndex - 1 + mediaItems.length) % mediaItems.length;
          setActiveIndex(prev);
          scrollActiveIntoView(prev);
          break;
        }
        case "Enter":
          e.preventDefault();
          insertMention(activeIndex);
          break;
        case "Escape":
          setShowDropdown(false);
          setMentionCursorPos(null);
          break;
      }
    },
    [activeIndex, insertMention, mediaItems.length, scrollActiveIntoView, showDropdown]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setMentionCursorPos(null);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`mt-0 resize-none overflow-y-auto border-gray-600 bg-gray-800 text-gray-100 placeholder:text-gray-400 ${
          className || ""
        }`}
        style={{ minHeight: "150px", maxHeight: "300px" }}
        disabled={disabled}
      />

      {showDropdown && mediaItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-64 overflow-hidden rounded-lg border border-gray-600 bg-gray-800 shadow-lg"
        >
          <div className="border-b border-gray-700 px-3 py-2 text-xs text-gray-400">
            {t("mediaMentionDropdownTitle")}
          </div>
          <div className="max-h-48 overflow-y-auto">
            {mediaItems.map((item, index) => (
              <button
                key={`${item.url}-${index}`}
                data-mention-item
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                  index === activeIndex ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
                onClick={() => insertMention(index)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={mentionLabels[index]}
                    className="h-8 w-8 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-gray-700">
                    {getMentionIcon(item.type)}
                  </div>
                )}
                <span className="text-sm text-gray-200">
                  {mentionLabels[index]}
                </span>
                <span className="ml-auto text-xs text-gray-500">
                  @{index + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
