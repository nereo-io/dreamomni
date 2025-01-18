"use client";

import React, { useState } from "react";
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
  const pathname = usePathname();
  const { user, setShowSignModal } = useAppContext();
  
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // 1. 检查登录状态
    if (!user?.uuid) {
      toast.error("请先登录后继续");
      setShowSignModal(true);
      return;
    }

    // 2. 检查使用次数
    try {
      const response = await fetch("/api/readings/check");
      const data = await response.json();
      
      if (!data.success) {
        toast.error(data.message || "检查使用次数失败");
        return;
      }

      if (!data.data.canRead) {
        toast.error(`今日解读次数已用完,请明天再来`);
        return;
      }

      // 3. 记录本次使用
      const createResponse = await fetch("/api/readings/create", {
        method: "POST"
      });
      const createData = await createResponse.json();
      
      if (!createData.success) {
        toast.error(createData.message || "记录使用次数失败");
        return;
      }

      // 4. 继续原有的表单提交逻辑
      setIsPending(true);
      const formData = new FormData(event.currentTarget as HTMLFormElement);

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

        const path = locale
          ? `/${locale}/reading/${result.values.customerId}`
          : `/reading/${result.values.customerId}`;

        logInfo(`Redirecting to: ${path}`);
        router.push(path);
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
