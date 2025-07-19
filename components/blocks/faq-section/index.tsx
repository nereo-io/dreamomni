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

  const finalTitle = title || 'Frequently Asked Questions';
  const finalDescription = description || 'Find answers to common questions about our AI video generation service.';

  const defaultFaqItems: FAQItem[] = [
    {
      id: "what-is-ai-image-to-video",
      question: 'What is an AI image to video generator?',
      answer: 'An AI image to video generator is a tool that uses artificial intelligence to animate static images and create short video clips. It analyzes your uploaded image and transforms it into dynamic motion based on your text prompts.',
    },
    {
      id: "best-image-to-video-generator",
      question: 'What is the best image to video AI generator?',
      answer: 'Veo3 AI offers one of the most advanced image to video generators with high-quality output, realistic motion, and support for various image formats. Our AI models are trained on millions of videos to ensure natural-looking animations.',
    },
    {
      id: "what-makes-us-stand-out",
      question: 'What makes our image to video AI generator stands out?',
      answer: 'Our generator stands out with its advanced AI models, high-resolution output up to 1080p, natural motion physics, and ability to understand complex prompts. We also offer fast processing times and commercial usage rights.',
    },
    {
      id: "what-images-can-work-with",
      question: 'What images can Veo3 AI work with?',
      answer: 'Veo3 AI works with most image formats including JPG, PNG, and WEBP. We support photos of people, animals, landscapes, objects, and artwork. For best results, use high-quality images with clear subjects and good lighting.',
    },
    {
      id: "is-generator-free",
      question: 'Is Veo3 AI\'s image to video AI generator free?',
      answer: 'Veo3 AI offers both free and premium options. New users get free credits to try the service. For regular use, we offer affordable subscription plans with more credits and advanced features like higher resolutions and longer videos.',
    },
  ];

  const finalFaqItems = faqItems || defaultFaqItems;

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
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            {finalTitle}
          </h2>
          {finalDescription && (
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {finalDescription}
            </p>
          )}
        </div>

        <div className="space-y-0">
          {finalFaqItems.map((item, index) => {
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
                {index < finalFaqItems.length - 1 && (
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