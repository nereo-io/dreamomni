"use client";

import React from "react";
import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import { QuestionItem } from "@/types/blocks/question";
import moment from "moment";

// 简单的日期格式化函数
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const month = date.toLocaleString("default", { month: "short" });
    const day = date.getDate().toString().padStart(2, "0");
    return `${month} ${day}`;
  } catch (error) {
    return "";
  }
}

// 截取文本，限制最大字数
function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

export function QuestionCard({ question }: { question: QuestionItem }) {
  const { slug, title, content, created_at, rating, votes, category } =
    question;

  // 格式化日期显示为MM-DD，不受时区影响
  const formattedDate = created_at
    ? moment(created_at).utc().format("MMMM DD")
    : "";

  // 截取标题，限制最多20字
  const truncatedContent = truncateText(content, 50);

  return (
    <div>
      <Link
        href={`/reading/${category}/questions/${slug}`}
        className="block bg-white rounded-lg shadow border border-gray-100 p-6 mb-5 hover:bg-gray-100 transition-shadow"
      >
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-base font-normal text-gray-900 leading-relaxed flex-1 pr-4">
            {title}
          </h3>
          {formattedDate && (
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {formattedDate}
            </span>
          )}
        </div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm text-gray-400 line-clamp-1">
            {truncatedContent}
          </span>
        </div>

        <div className="flex items-center">
          <div className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-sm text-gray-600">{rating || 0}%</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default QuestionCard;
