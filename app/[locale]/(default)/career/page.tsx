'use client';

import { useState, useEffect } from 'react';
import Feature3 from "@/components/blocks/feature3";
import Feature3Skeleton from "@/components/blocks/feature3/skeleton";
import QuestionSelector from "@/components/blocks/question-selector";
import QuestionSelectorSkeleton from "@/components/blocks/question-selector/skeleton";
import CustomerInputForm from "@/components/readers/CustomerInputForm";
import { getCareerPage, getReaderPage } from "@/services/page";
import { CareerPage as CareerPageType } from "@/types/pages/career";
import { ReaderPage } from "@/types/pages/reader";

export default function CareerPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [pageData, setPageData] = useState<CareerPageType | null>(null);
  const [messages, setMessages] = useState<ReaderPage | null>(null);

  // 在组件挂载时获取页面数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const page = await getCareerPage(locale);
        const readerMessages = await getReaderPage(locale);
        setPageData(page);
        setMessages(readerMessages);
      } catch (error) {
        console.error('Failed to fetch page data:', error);
      }
    };
    fetchData();
  }, [locale]);

  const handleQuestionSubmit = (question: string) => {
    setSelectedQuestion(question);
    setShowForm(true);
  };

  if (!pageData || !messages) {
    return (
      <main>
        <QuestionSelectorSkeleton />
        <Feature3Skeleton />
      </main>
    );
  }

  return (
    <main>
      {!showForm ? (
        <QuestionSelector {...pageData.questionSelector} onSubmit={handleQuestionSubmit} />
      ) : (
        <CustomerInputForm 
          messages={messages} 
          selectedQuestion={selectedQuestion}
        />
      )}
      {pageData.howItWorks && <Feature3 section={pageData.howItWorks} />}
    </main>
  );
}
