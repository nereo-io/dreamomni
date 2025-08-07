"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Section as SectionType } from "@/types/blocks/section";
import { ChevronRight, ChevronDown } from "lucide-react";
import { SectionHeader } from "@/components/blocks/section-header";

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
    <section id={section.name} className="w-full py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-16">
          <SectionHeader
            title={section.title}
            description={section.description}
            showButton={false}
            centerAlign={true}
          />
        </div>
        <div className="space-y-0">
          {section.items?.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            return (
              <div key={index}>
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-0 py-6 text-left flex items-center justify-between hover:opacity-80 transition-opacity group"
                >
                  <div className="flex items-center space-x-4">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-foreground flex-shrink-0 transition-transform" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-foreground flex-shrink-0 transition-transform" />
                    )}
                    <h3 className="text-xl md:text-2xl font-normal text-foreground">
                      {item.title}
                    </h3>
                  </div>
                </button>
                {isExpanded && (
                  <div className="pl-9 pb-6">
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}
                {index < (section.items?.length || 0) - 1 && (
                  <hr className="border-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
