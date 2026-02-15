"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  description?: string;
  faqItems?: FAQItem[];
}

export function FAQSection({ title, description, faqItems }: FAQSectionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  if (!faqItems || faqItems.length === 0) {
    return null;
  }

  const finalTitle = title || 'Frequently Asked Questions';
  const finalDescription = description || 'Find answers to common questions about our AI video generation service.';

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (openItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="w-full py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            {finalTitle}
          </h2>
          {finalDescription && (
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {finalDescription}
            </p>
          )}
        </div>

        <div className="space-y-0">
          {faqItems.map((item, index) => {
            const isOpen = openItems.has(item.id);
            return (
              <div key={item.id}>
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-0 py-6 text-left flex items-center justify-between hover:opacity-80 transition-opacity group"
                >
                  <div className="flex items-center space-x-4">
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 text-foreground flex-shrink-0 transition-transform" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-foreground flex-shrink-0 transition-transform" />
                    )}
                    <h3 className="text-xl md:text-2xl font-normal text-foreground">
                      {item.question}
                    </h3>
                  </div>
                </button>
                {isOpen && (
                  <div className="pl-9 pb-6">
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
                {index < faqItems.length - 1 && (
                  <hr className="border-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}