"use client";

import { useState } from "react";
import QuestionSelector from "@/components/blocks/question-selector";
import CustomerInputForm from "@/components/readers/CustomerInputForm";
import { QuestionSelectorSection } from "@/types/pages/career";
import { ReaderPage } from "@/types/pages/reader";

interface Props {
  messages: ReaderPage;
  questionSelector: QuestionSelectorSection;
}

export default function QuestionForm({ messages, questionSelector }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");

  const handleQuestionSubmit = (question: string) => {
    setSelectedQuestion(question);
    setShowForm(true);
  };

  return (
    <div>
      {!showForm ? (
        <QuestionSelector 
          {...questionSelector} 
          onSubmit={handleQuestionSubmit}
          defaultQuestion={selectedQuestion}
          send={questionSelector.send}
        />
      ) : (
        <CustomerInputForm 
          messages={messages} 
          selectedQuestion={selectedQuestion}
          onBack={() => setShowForm(false)}
        />
      )}
    </div>
  );
} 