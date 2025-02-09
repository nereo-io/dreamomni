"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { createCustomerInput, State } from "@/services/customerInputAction";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { logInfo } from "@/lib/utils/logger";
import { DatePicker } from "@/components/ui/date-picker";
import { HourSelect } from "@/components/ui/hour-select";
import { IoMale, IoFemale } from "react-icons/io5";
import { ReaderPage } from "@/types/pages/reader";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
// import { Membership } from '@/types/membership';

interface FormData {
  gender: string;
  birthDate: string;
  birthTime: string;
}

interface Props {
  messages: ReaderPage;
  selectedQuestion?: string;
  onBack?: () => void;
}

export default function CustomerInputForm({
  messages,
  selectedQuestion,
  onBack,
}: Props) {
  const router = useRouter();
  const params = useParams();
  const { user, setShowSignModal, membership, isLoadingMembership } = useAppContext();
  
  const initialState: State = {
    message: null,
    errors: {},
    values: {} as FormData,
  };
  const [state, setState] = useState(initialState);
  const [gender, setGender] = useState(state.values?.gender || "");
  const [birthYear, setBirthYear] = useState<number>(
    new Date().getFullYear() - 18
  );
  const [birthMonth, setBirthMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [birthDay, setBirthDay] = useState<number>(new Date().getDate());
  const [birthHour, setBirthHour] = useState<number>(new Date().getHours());
  const [isPending, setIsPending] = useState(false);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);

  // 获取剩余次数
  useEffect(() => {
    const fetchReadingCount = async () => {
      if (!user?.uuid) return;
      
      try {
        const response = await fetch('/api/readings/check');
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    
    // 1. 检查登录状态
    if (!user?.uuid) {
      setIsPending(false);
      toast.error(messages.errors.pleaseLogin);
      setShowSignModal(true);
      return;
    }

    // 2. 检查使用次数
    try {
      const response = await fetch("/api/readings/check");
      const data = await response.json();
      
      if (data.code !== 0) {
        setIsPending(false); 
        toast.error(data.message || messages.errors.checkUsageError);
        return;
      }

      if (!data.data.canRead) {
        // 如果是会员，不需要检查剩余次数
        if (!data.data.isMember) {
          toast.error(messages.errors.noRemainingReadings);
          return;
        }
      }

      // 3. 记录本次使用
      const createResponse = await fetch("/api/readings/create", {
        method: "POST"
      });
      const createData = await createResponse.json();
      
      if (createData.code !== 0) {
        toast.error(createData.message || messages.errors.recordUsageError);
        return;
      }

      // 更新剩余次数显示
      if (!data.data.isMember) {
        setRemainingCount(createData.data.remainingCount);
      }
    } catch (error) {
      console.error(error);
      setIsPending(false);
      return;
    }

    // 4. 继续原有的表单提交逻辑

    try {
      const formData = new FormData();

      // 手动设置所有需要的字段
      formData.set("gender", gender);
      formData.set("birthYear", birthYear.toString());
      formData.set("birthMonth", birthMonth.toString());
      formData.set("birthDay", birthDay.toString());
      formData.set("birthHour", birthHour.toString());

      if (selectedQuestion) {
        formData.set("question", selectedQuestion);
      }

      const result = await createCustomerInput(state, formData);

      if (result.message === "Success" && result.values?.customerId) {
        const { locale } = params;

        let basePath = locale
          ? `/${locale}/reading/${result.values.customerId}`
          : `/reading/${result.values.customerId}`;

        // 如果有问题，添加到URL参数中
        const question = formData.get('question');
        if (question && typeof question === 'string') {
          // 使用Base64编码问题内容
          const encodedQuestion = btoa(encodeURIComponent(question));
          basePath += `?q=${encodedQuestion}`;
        }

        logInfo(`Redirecting to: ${basePath}`);

        router.push(basePath);
        return;
      }

      setState(result);
      setIsPending(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("操作失败,请稍后重试");
      setIsPending(false);
    }
  };

  return (
    <section className="py-8 md:py-16 bg-muted/30">
      <div className="container px-4 md:px-6 max-w-2xl">
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3">
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              {messages.title}
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            {messages.description}
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          <Card className="p-4 md:p-6">
            <CardContent className="space-y-8 p-0">
              {/* 出生日期和时间 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-base">
                      {messages.form.birthDate.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {messages.form.birthDate.info}
                    </p>
                  </div>
                  <DatePicker
                    year={birthYear}
                    month={birthMonth}
                    day={birthDay}
                    onYearChange={setBirthYear}
                    onMonthChange={setBirthMonth}
                    onDayChange={setBirthDay}
                  />
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-base">
                      {messages.form.birthTime.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {messages.form.birthTime.info}
                    </p>
                  </div>
                  <HourSelect value={birthHour} onChange={setBirthHour} />
                </div>
              </div>

              {/* 性别选择 */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-base">
                    {messages.form.gender.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {messages.form.gender.info}
                  </p>
                </div>
                <input type="hidden" name="gender" value={gender} />
                <ToggleGroup
                  type="single"
                  id="gender"
                  value={gender}
                  onValueChange={(value: string) => {
                    if (value) {
                      setGender(value);
                    }
                  }}
                  className="justify-start gap-4"
                >
                  <ToggleGroupItem
                    value="male"
                    className="flex-1 h-12 border border-input data-[state=on]:border-0 
                    data-[state=on]:bg-orange-500 data-[state=on]:text-white rounded-md text-base"
                  >
                    <IoMale className="w-5 h-5 mr-2" />
                    {messages.form.gender.male}
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="female"
                    className="flex-1 h-12 border border-input data-[state=on]:border-0 
                    data-[state=on]:bg-orange-500 data-[state=on]:text-white rounded-md text-base"
                  >
                    <IoFemale className="w-5 h-5 mr-2" />
                    {messages.form.gender.female}
                  </ToggleGroupItem>
                </ToggleGroup>
                {state.errors?.gender && (
                  <p className="text-sm text-destructive">
                    {state.errors.gender[0]}
                  </p>
                )}
              </div>

              {/* 按钮组 */}
              <div className="space-y-4 pt-4">
                {/* 使用次数提示 - 只在加载完成且有用户登录时显示 */}
                 {user?.uuid && !isLoadingMembership && remainingCount !== null && (
                  <div className="text-center">
                    {membership?.status === 'active' ? (
                      <p className="text-sm text-orange-500">
                        {messages.customer.input.unlimited_usage}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {messages.customer.input.remaining_readings.replace('{count}', remainingCount.toString())}
                      </p>
                    )}
                  </div>
                )} 
                {!user?.uuid && (
                  <p className="text-center text-sm text-orange-500">
                    {messages.loginPrompt}
                  </p>
                )} 
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-base"
                  disabled={isPending}
                >
                  {isPending
                    ? messages.button.submitting
                    : messages.button.submit}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-base hover:bg-orange-500/10"
                  onClick={onBack}
                >
                  {messages.button.back}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </section>
  );
}
