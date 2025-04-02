"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  CalendarDays,
  SparklesIcon,
  ImageIcon,
  CalculatorIcon,
  PiIcon,
  FlaskConicalIcon,
  LeafIcon,
  BarChartIcon,
  UserIcon,
  UsersIcon,
  X,
  HeartIcon,
  HeartHandshakeIcon,
  UserPlusIcon,
  UsersRoundIcon,
  HeartPulseIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import CustomerInputFormModal from "@/components/readers/CustomerInputFormModal";
import { useAppContext } from "@/contexts/app";
import { ReaderPage } from "@/types/pages/reader";
import { toast } from "sonner";
import { CustomerInfo } from "@/types/customer";
import { ChatSession, ChatStatus } from "@/types/chat.d";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TextareaAutosize from "react-textarea-autosize";
import { NavCategory } from "@/components/blocks/nav-category";
import { QuestionSelector as QuestionSelectorType } from "@/types/blocks/question-selector";
import { QuestionSuggestions } from "@/types/blocks/question-suggestions";
interface Props {
  formMessages: ReaderPage;
  questionSelector: QuestionSelectorType;
  questionSuggestions?: QuestionSuggestions;
  defaultQuestion?: string;
  defaultReadingType?: "single" | "double";
}

export default function QuestionSelector({
  formMessages,
  questionSelector,
  questionSuggestions,
  defaultQuestion = "",
  defaultReadingType = "single",
}: Props) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [question, setQuestion] = useState(defaultQuestion);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchMode, setMatchMode] = useState(defaultReadingType); // 匹配模式：单人分析/双人匹配
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [showDoubleMatchingInfo, setShowDoubleMatchingInfo] = useState(true); // 控制双人匹配说明的显示与隐藏

  // 获取剩余次数
  const [isPending, setIsPending] = useState(false);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);

  // 获取用户信息
  const { user, setShowSignModal, membership, isLoadingMembership, setChat } =
    useAppContext();

  // 处理customerInfo
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<CustomerInfo | null>(null); // 伴侣信息
  const [isLoading, setIsLoading] = useState(true);

  // 从本地存储中读取用户偏好
  useEffect(() => {
    // 确保代码只在客户端执行
    if (typeof window !== "undefined") {
      const savedPreference = localStorage.getItem("hideDoubleMatchingInfo");
      if (savedPreference === "true" && matchMode === "double") {
        setShowDoubleMatchingInfo(false);
      }
    }
  }, [matchMode]);

  // 保存用户偏好到本地存储
  const handleCloseInfo = () => {
    setShowDoubleMatchingInfo(false);
    // 确保代码只在客户端执行
    if (typeof window !== "undefined") {
      localStorage.setItem("hideDoubleMatchingInfo", "true");
    }
  };

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

      if (result.code === 0 && result.data) {
        // 处理返回的数组数据
        if (Array.isArray(result.data)) {
          const selfInfo = result.data.find(
            (info: CustomerInfo) => info.type === "self" || !info.type
          );
          const partnerInfo = result.data.find(
            (info: CustomerInfo) => info.type === "partner"
          );

          setCustomerInfo(selfInfo || null);
          setPartnerInfo(partnerInfo || null);
        } else {
          // 兼容性处理：如果返回单个对象，按type进行区分
          setCustomerInfo(result.data.type === "partner" ? null : result.data);
          setPartnerInfo(result.data.type === "partner" ? result.data : null);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("获取客户信息失败:", error);
      setCustomerInfo(null);
      setPartnerInfo(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerInfo();
  }, [user?.uuid]);

  // 将问题数据转换为数组，并添加分类信息
  const questionList = questionSuggestions?.questions
    ? Object.entries(questionSuggestions.questions).map(([id, question]) => ({
        id,
        text: question.text,
        readingType: question.reading_type,
        // category: question.category,
        category: id.replace(/\d+$/, ""),
      }))
    : [];

  // 根据选中的分类筛选问题
  const filteredQuestions = questionList.filter(
    (q) => selectedCategory === "all" || q.category === selectedCategory
  );

  const handleQuestionClick = (
    text: string,
    reading_type: "single" | "double"
  ) => {
    setQuestion(text);
    setMatchMode(reading_type);
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

    if (matchMode === "double" && membership?.status !== "active") {
      console.log(membership);
      router.push("/pricing");
      return;
    }

    // 3. 检查是否填写生辰信息
    if (
      customerInfo === null ||
      (Array.isArray(customerInfo) && customerInfo.length === 0)
    ) {
      setIsPending(false);
      setIsModalOpen(true);
      return;
    }

    // 4. 双人匹配模式下，检查伴侣信息
    if (
      matchMode === "double" &&
      (partnerInfo === null ||
        (Array.isArray(partnerInfo) && partnerInfo.length === 0))
    ) {
      setIsPending(false);
      setPartnerModalOpen(true);
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
        partner_info_id: partnerInfo?.id || undefined,
        partner_info: partnerInfo || undefined,
        is_matching: matchMode === "double",
      };
      setChat(chat);
      // console.log(chat);

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
    <section className="pt-2 md:pt-4">
      <div className="container px-4 md:px-6 max-w-4xl">
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-3xl">
            {/* 匹配模式选择 */}
            <div className="mb-1">
              <Tabs
                defaultValue="single"
                value={matchMode}
                onValueChange={(value) => {
                  setMatchMode(value as "single" | "double");
                  // 当切换到双人匹配模式时，如果用户没有明确选择隐藏提示，则显示提示信息
                  if (value === "double") {
                    const savedPreference = localStorage.getItem(
                      "hideDoubleMatchingInfo"
                    );
                    if (savedPreference !== "true") {
                      setShowDoubleMatchingInfo(true);
                    }
                  }
                }}
                className="w-full flex flex-col"
              >
                <TabsList className="w-full mb-1 max-w-xs mx-auto rounded-2xl">
                  <TabsTrigger
                    value="single"
                    className="flex-1 flex items-center rounded-2xl"
                  >
                    <UserIcon className="w-4 h-4" />
                    {questionSelector.matching?.single || "单人分析"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="double"
                    className="flex-1 flex items-center rounded-2xl relative"
                  >
                    <HeartHandshakeIcon className="w-5 h-5 text-rose-500" />
                    {questionSelector.matching?.double || "双人匹配"}
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs px-1 rounded text-black">
                      Pro
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="mt-0">
                  {/* 单人分析内容 */}
                </TabsContent>

                <TabsContent value="double" className="mt-0">
                  {/* 双人匹配说明 */}
                  {showDoubleMatchingInfo && (
                    <div className="mb-0 p-3 bg-orange-50 border border-orange-200 rounded-lg relative">
                      <div className="flex items-center text-sm text-orange-700 mb-1">
                        <span className="font-medium mr-1">
                          {questionSelector.matching?.double_title ||
                            "双人匹配 - 高级功能"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {questionSelector.matching?.description ||
                          "分析两个人的八字命盘匹配度，揭示缘分与关系走向。此功能需要会员权限，点击发送将跳转到支付界面。"}
                      </p>
                      {/* 关闭按钮 */}
                      <button
                        onClick={handleCloseInfo}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        aria-label="关闭提示"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* 输入区域 */}
            <div className="relative mb-4 md:mb-4 overflow-hidden rounded-lg border bg-white dark:bg-background transition-colors duration-200 focus-within:border-orange-500">
              <TextareaAutosize
                value={question}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                minRows={2}
                maxRows={15}
                placeholder={
                  questionSelector.placeholder ||
                  "Type your question here or select from suggestions below..."
                }
                className="w-full pb-12 px-3 pt-2 text-base md:text-lg resize-none border-none outline-none focus:outline-none focus:ring-0 bg-transparent"
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
                        : "text-orange-500 hover:bg-orange-500/5"
                    }
                  `}
                >
                  <CalendarDays className="w-4 h-4" />
                  {customerInfo === null ||
                  (Array.isArray(customerInfo) && customerInfo.length === 0)
                    ? questionSelector.customer.input.add_birth_info
                    : formatBirthInfo(customerInfo)}
                </div>

                {/* 双人匹配模式下，显示伴侣信息输入按钮 */}
                {matchMode === "double" && (
                  <div
                    onClick={() => setPartnerModalOpen(true)}
                    className={`
                      inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm cursor-pointer
                      ${
                        partnerInfo === null ||
                        (Array.isArray(partnerInfo) && partnerInfo.length === 0)
                          ? "text-muted-foreground hover:bg-gray-100"
                          : "text-orange-500 hover:bg-orange-500/5"
                      }
                    `}
                  >
                    <CalendarDays className="w-4 h-4" />
                    {partnerInfo === null ||
                    (Array.isArray(partnerInfo) && partnerInfo.length === 0)
                      ? questionSelector.customer.input.partner_birth_info
                      : formatBirthInfo(partnerInfo)}
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  className="bg-orange-500 hover:bg-orange-600 h-9 px-4"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {questionSelector.send || "发送"}
                </Button>
              </div>
            </div>
            {/* 分类标签 */}
            {questionSuggestions &&
              Object.keys(questionSuggestions.categories).length > 1 && (
                <div className="flex gap-1.5 md:gap-2 flex-wrap mb-4 md:mb-6">
                  {Object.entries(questionSuggestions.categories).map(
                    ([key, label]) => (
                      <Badge
                        key={key}
                        variant={
                          selectedCategory === key ? "default" : "outline"
                        }
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
            {questionSuggestions && questionSuggestions.questions && (
              <ScrollArea className="h-[300px] md:h-[400px] rounded-md">
                <div className="grid gap-2 pr-3 md:pr-4">
                  {filteredQuestions.map((q) => (
                    <Card
                      key={q.id}
                      className="p-3 md:p-4 cursor-pointer transition-colors hover:bg-orange-500/5 group"
                      onClick={() => handleQuestionClick(q.text, q.readingType)}
                    >
                      <div className="flex items-start gap-2">
                        <p className="flex-1 text-sm md:text-base group-hover:text-orange-600">
                          {q.text}
                        </p>
                        {q.readingType === "double" ? (
                          <HeartHandshakeIcon className="w-4 h-4 text-rose-500 flex-shrink-0 mt-1 transition-all duration-200 group-hover:scale-110" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-foreground flex-shrink-0 mt-1 transition-all duration-200 group-hover:scale-110" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* 用户生辰信息模态框 */}
            <CustomerInputFormModal
              messages={formMessages}
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
              customerInfo={customerInfo}
              onSuccess={fetchCustomerInfo}
              type="self"
            />

            {/* 伴侣生辰信息模态框 */}
            <CustomerInputFormModal
              messages={{
                ...formMessages,
                title: formMessages.partner_title || "输入对方信息",
                description:
                  formMessages.partner_description ||
                  "请输入对方的生辰信息，以便进行关系分析",
              }}
              open={partnerModalOpen}
              onOpenChange={setPartnerModalOpen}
              customerInfo={partnerInfo}
              type="partner"
              onSuccess={fetchCustomerInfo}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
