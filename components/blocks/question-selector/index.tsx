"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { QuestionSelectorSection } from "@/types/pages/career";
import { Card } from "@/components/ui/card";

interface Props extends QuestionSelectorSection {
  onSubmit: (question: string) => void;
}

export default function QuestionSelector({
  title,
  subtitle,
  placeholder,
  categories,
  questions,
  onSubmit,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [question, setQuestion] = useState("");
  const [charCount, setCharCount] = useState(0);
  const maxChars = 300;

  // 将问题数据转换为数组，并添加分类信息
  const questionList = Object.entries(questions).map(([id, text]) => ({
    id,
    text,
    category: id.replace(/\d+$/, ""),
  }));

  // 根据选中的分类筛选问题
  const filteredQuestions = questionList.filter(
    (q) => selectedCategory === "all" || q.category === selectedCategory
  );

  const handleQuestionClick = (text: string) => {
    if (text.length <= maxChars) {
      setQuestion(text);
      setCharCount(text.length);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setQuestion(text);
      setCharCount(text.length);
    }
  };

  const handleSubmit = () => {
    if (question.trim()) {
      onSubmit(question);
      setQuestion("");
      setCharCount(0);
    }
  };

  // 处理回车键提交
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        </div>

        <Card className="p-6">
          {/* 输入区域 */}
          <div className="relative mb-8">
            <Textarea
              value={question}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="pr-24 min-h-[100px] text-lg resize-none"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {charCount}/{maxChars}
              </span>
              <Button 
                onClick={handleSubmit} 
                size="icon"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 分类标签 */}
          <div className="flex gap-2 flex-wrap mb-6">
            {Object.entries(categories).map(([key, label]) => (
              <Badge
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                className={`
                  cursor-pointer text-sm px-4 py-1.5 
                  ${selectedCategory === key 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : 'hover:bg-orange-500/10'
                  }
                `}
                onClick={() => setSelectedCategory(key)}
              >
                {label}
              </Badge>
            ))}
          </div>

          {/* 问题列表 */}
          <ScrollArea className="h-[400px] rounded-md">
            <div className="grid gap-2 pr-4">
              {filteredQuestions.map((q) => (
                <Card
                  key={q.id}
                  className="p-4 cursor-pointer transition-colors hover:bg-orange-500/5 group"
                  onClick={() => handleQuestionClick(q.text)}
                >
                  <p className="text-base group-hover:text-orange-600">{q.text}</p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </section>
  );
} 