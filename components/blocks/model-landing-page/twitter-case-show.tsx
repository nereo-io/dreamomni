"use client";
import React from "react";
import { TwitterCaseShowProps } from "@/types/pages/nano-banana";

export default function TwitterCaseShow({ section }: TwitterCaseShowProps) {
  return (
    <div className="w-full py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-8">{section.title}</h2>
        {/* 使用CSS columns实现瀑布流布局 */}
        <div className="columns-1 sm:columns-2 lg:columns-4 gap-6 column-fill-auto">
          {section.content.map((item) => (
            <iframe
              key={item.id || `item-${Math.random().toString(36).substr(2, 9)}`}
              src={item.src}
              width={item.width}
              height={item.height}
              className="w-full object-cover border-0 rounded-lg shadow-lg mb-6"
              title={
                item.id ||
                `Twitter item ${Math.random().toString(36).substr(2, 9)}`
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
