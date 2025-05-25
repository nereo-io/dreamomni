"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Section as SectionType } from "@/types/blocks/section";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FAQ({ section }: { section: SectionType }) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(index)) {
      newExpandedItems.delete(index);
    } else {
      newExpandedItems.add(index);
    }
    setExpandedItems(newExpandedItems);
  };

  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16">
      <div className="container">
        <div className="text-center">
          {section.label && (
            <Badge className="text-xs font-medium">{section.label}</Badge>
          )}
          <h2 className="mt-4 text-4xl font-semibold">{section.title}</h2>
          <p className="mt-6 font-medium text-muted-foreground">
            {section.description}
          </p>
        </div>
        <div className="mx-auto mt-14 grid gap-6 md:grid-cols-2 md:gap-8">
          {section.items?.map((item, index) => (
            <div key={index}>
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center gap-4 py-3 text-left hover:opacity-80 transition-opacity"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-primary font-mono text-xs text-primary">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <div className="flex items-center justify-center w-6 h-6">
                  {expandedItems.has(index) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
              {expandedItems.has(index) && (
                <div className="pt-3 pl-10">
                  <p className="text-md text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
