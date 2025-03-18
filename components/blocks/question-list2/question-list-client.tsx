"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface QuestionListClientProps {
  questions: any[];
  currentPage: number;
  totalPages: number;
  selectedZodiac: string | null;
  category: string;
  locale: string;
}

const zodiacSigns = [
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  "snake",
  "horse",
  "goat",
  "monkey",
  "rooster",
  "dog",
  "pig",
];

export function QuestionListClient({
  questions,
  currentPage,
  totalPages,
  selectedZodiac,
  category,
  locale,
}: QuestionListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const cleanContent = (content: string) => {
    return content.replace(/[#*]/g, "");
  };

  const createQueryString = (params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });
    return newSearchParams.toString();
  };

  const handlePageChange = (newPage: number) => {
    const queryString = createQueryString({ page: newPage.toString() });
    router.replace(`${pathname}?${queryString}`, { scroll: false });
  };

  const handleZodiacFilter = (zodiac: string | null) => {
    const queryString = createQueryString({
      zodiac: zodiac,
      page: "1",
    });
    router.replace(`${pathname}?${queryString}`, { scroll: false });
  };

  return (
    <div className="space-y-8">
      {/* 生肖标签过滤器 */}
      <div className="flex flex-wrap gap-3">
        <Badge
          variant={selectedZodiac === null ? "default" : "outline"}
          className="cursor-pointer text-base px-4 py-2 rounded-full"
          onClick={() => handleZodiacFilter(null)}
        >
          All
        </Badge>
        {zodiacSigns.map((zodiac) => (
          <Badge
            key={zodiac}
            variant={selectedZodiac === zodiac ? "default" : "outline"}
            className="cursor-pointer text-base px-4 py-2 rounded-full"
            onClick={() => handleZodiacFilter(zodiac)}
          >
            {zodiac.charAt(0).toUpperCase() + zodiac.slice(1)}
          </Badge>
        ))}
      </div>

      {/* 问题列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map((question) => (
          <Link
            key={question.slug}
            href={`/chinese-zodiac-calculator/${question.slug}`}
            className="block group"
          >
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-10 w-10 flex-shrink-0 relative rounded-full overflow-hidden">
                    <Image
                      src={`/imgs/zodiac/${question.tags[1]}.png`}
                      alt={question.tags[1]}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {question.title}
                  </CardTitle>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {question.tags?.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <CardDescription className="line-clamp-3 mb-4">
                  {cleanContent(question.content).substring(0, 150)}...
                </CardDescription>

                <div className="text-sm text-muted-foreground text-right">
                  {`rating: ${question.rating || 0}% (${
                    question.votes || 0
                  } votes)`}
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* 分页 */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={() => handlePageChange(currentPage - 1)}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                onClick={() => handlePageChange(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={() => handlePageChange(currentPage + 1)}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
