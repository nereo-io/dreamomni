"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, CalendarDays } from "lucide-react";
import { QuestionSelectorSection } from "@/types/pages/career";
import { Card } from "@/components/ui/card";
import CustomerInputFormModal from "@/components/readers/CustomerInputFormModal";
import { useAppContext } from "@/contexts/app";
import { ReaderPage } from "@/types/pages/reader";
import { toast } from "sonner";
import { CustomerInfo } from "@/types/customer";
import { ChatSession, ChatStatus } from "@/types/chat.d";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

interface Props {
  formMessages: ReaderPage;
  questionSelector: QuestionSelectorSection;
}

export default function QuestionSelector({
  formMessages,
  questionSelector,
}: Props) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [question, setQuestion] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 获取剩余次数
  const [isPending, setIsPending] = useState(false);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);

  // 获取用户信息
  const { user, setShowSignModal, membership, isLoadingMembership, setChat } =
    useAppContext();

  // 处理customerInfo
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 获取剩余次数
  useEffect(() => {
    const fetchReadingCount = async () => {
      if (!user?.uuid) {
        return;
      }

      try {
        const response = await fetch("/api/readings/check");
        const data = await response.json();

        if (data.code === 0) {
          setRemainingCount(data.data.remainingCount);
        }
      } catch (error) {
        console.error("Failed to fetch reading count:", error);
      }
    };

    fetchReadingCount();
  }, [user?.uuid]);

  // 格式化日期显示
  const formatBirthInfo = (info: CustomerInfo) => {
    return `${info.birthMonth}-${info.birthDay}-${info.birthYear}`;
  };

  // 获取用户信息
  const fetchCustomerInfo = async () => {
    if (!user?.uuid) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/customer-info/list");
      const result = await response.json();

      if (result.code === 0) {
        setCustomerInfo(result.data); // data 可能是 CustomerInfo 或 null
        setIsLoading(false);
      }
    } catch (error) {
      console.error("获取客户信息失败:", error);
      setCustomerInfo(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerInfo();
  }, [user?.uuid]);

  // 将问题数据转换为数组，并添加分类信息
  const questionList = Object.entries(questionSelector.questions).map(
    ([id, text]) => ({
      id,
      text,
      category: id.replace(/\d+$/, ""),
    })
  );

  // 根据选中的分类筛选问题
  const filteredQuestions = questionList.filter(
    (q) => selectedCategory === "all" || q.category === selectedCategory
  );

  const handleQuestionClick = (text: string) => {
    setQuestion(text);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const handleSubmit = () => {
    // 1. 检查登录状态
    if (!user?.uuid) {
      setIsPending(false);
      toast.message(questionSelector.errors.pleaseLogin);
      setShowSignModal(true);
      return;
    }

    // 2. 使用已缓存的状态，remainingCount为0时表示无法继续阅读
    try {
      if (remainingCount === 0) {
        setIsPending(false);
        toast.error(questionSelector.errors.noRemainingReadings);
        return;
      }
    } catch (error) {
      console.error(error);
      setIsPending(false);
      return;
    }

    // 3. 检查是否填写生辰信息
    // console.log("customerInfo", customerInfo);
    // console.log("customerInfo.length", !customerInfo);
    if (
      customerInfo === null ||
      (Array.isArray(customerInfo) && customerInfo.length === 0)
    ) {
      setIsPending(false);
      // toast.message(questionSelector.errors.pleaseInputBirthInfo);
      setIsModalOpen(true);
      return;
    }

    if (question.trim() && customerInfo?.id) {
      const chat: ChatSession = {
        uuid: uuidv4(),
        user_uuid: user.uuid,
        customer_info_id: customerInfo.id,
        title: question,
        status: ChatStatus.New,
        created_at: new Date(),
        customer_info: customerInfo,
      };
      setChat(chat);

      const jump_url = `/chat/${chat.uuid}`;
      router.push(jump_url);
    }
  };

  // 处理回车键提交
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsPending(true);

      handleSubmit();
    }
  };

  return (
    <section className="pb-8 pt-2 md:pb-16 md:pt-4">
      <div className="container px-4 md:px-6 max-w-4xl">
        <Card className="p-4 md:p-6">
          {/* 输入区域 */}
          <div className="relative mb-6 md:mb-8">
            <Textarea
              value={question}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={questionSelector.placeholder}
              className="pb-12 min-h-[80px] md:min-h-[100px] text-base md:text-lg resize-none"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              {/* 生辰信息标签 */}
              <div
                onClick={() => setIsModalOpen(true)}
                className={`
                  inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm cursor-pointer
                  ${
                    customerInfo === null ||
                    (Array.isArray(customerInfo) && customerInfo.length === 0)
                      ? "text-muted-foreground hover:bg-gray-100"
                      : "text-orange-500  hover:bg-orange-500/5"
                  }
                `}
              >
                <CalendarDays className="w-4 h-4" />
                {customerInfo === null ||
                (Array.isArray(customerInfo) && customerInfo.length === 0)
                  ? questionSelector.customer.input.add_birth_info
                  : formatBirthInfo(customerInfo)}
              </div>
              {/* 使用次数提示 - 只在加载完成且有用户登录时显示
              {user?.uuid &&
                !isLoadingMembership &&
                remainingCount !== null && (
                  <div className="text-center">
                    {membership?.status === "active" ? (
                      <p className="text-sm text-orange-500">
                        {questionSelector.customer.input.unlimited_usage}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {questionSelector.customer.input.remaining_readings.replace(
                          "{count}",
                          remainingCount.toString()
                        )}
                      </p>
                    )}
                  </div>
                )} */}
              <Button
                onClick={handleSubmit}
                className="bg-orange-500 hover:bg-orange-600 h-9 px-4"
              >
                <Send className="h-4 w-4 mr-2" />
                {questionSelector.send}
              </Button>
            </div>
          </div>

          {/* 分类标签 */}
          {questionSelector.categories &&
            Object.keys(questionSelector.categories).length > 0 && (
              <div className="flex gap-1.5 md:gap-2 flex-wrap mb-4 md:mb-6">
                {Object.entries(questionSelector.categories).map(
                  ([key, label]) => (
                    <Badge
                      key={key}
                      variant={selectedCategory === key ? "default" : "outline"}
                      className={`
                  cursor-pointer text-xs md:text-sm px-3 md:px-4 py-1 md:py-1.5
                  ${
                    selectedCategory === key
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "hover:bg-orange-500/10"
                  }
                `}
                      onClick={() => setSelectedCategory(key)}
                    >
                      {label}
                    </Badge>
                  )
                )}
              </div>
            )}

          {/* 问题列表 */}
          <ScrollArea className="h-[300px] md:h-[400px] rounded-md">
            <div className="grid gap-2 pr-3 md:pr-4">
              {filteredQuestions.map((q) => (
                <Card
                  key={q.id}
                  className="p-3 md:p-4 cursor-pointer transition-colors hover:bg-orange-500/5 group"
                  onClick={() => handleQuestionClick(q.text)}
                >
                  <p className="text-sm md:text-base group-hover:text-orange-600">
                    {q.text}
                  </p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* 生辰信息模态框 */}
        <CustomerInputFormModal
          messages={formMessages}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          customerInfo={customerInfo}
          onSuccess={fetchCustomerInfo}
        />
      </div>
    </section>
  );
}
