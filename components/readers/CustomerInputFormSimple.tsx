"use client";

import React, { useState, useEffect } from "react";
import { createCustomerInput, State } from "@/services/customerInputAction";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DatePicker } from "@/components/ui/date-picker";
import { HourSelect } from "@/components/ui/hour-select";
import { IoMale, IoFemale } from "react-icons/io5";
import { ReaderPage } from "@/types/pages/reader";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { CustomerInfo } from "@/types/customer";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { InfoCircledIcon } from "@radix-ui/react-icons";

interface FormData {
  gender: string;
  birthDate: string;
  birthTime: string;
}

interface Props {
  messages: ReaderPage;
  onSuccess?: (data: any) => void;
  customerInfo?: CustomerInfo | null;
  type: "self" | "partner";
}

export default function CustomerInputForm({
  messages,
  onSuccess,
  customerInfo,
  type,
}: Props) {
  const { user } = useAppContext();

  const initialState: State = {
    message: null,
    errors: {},
    values: {} as FormData,
  };
  const [state, setState] = useState(initialState);
  const [gender, setGender] = useState(customerInfo?.gender || "");
  const [birthYear, setBirthYear] = useState<number>(
    customerInfo?.birthYear || new Date().getFullYear() - 18
  );
  const [birthMonth, setBirthMonth] = useState<number>(
    customerInfo?.birthMonth || new Date().getMonth() + 1
  );
  const [birthDay, setBirthDay] = useState<number>(
    customerInfo?.birthDay || new Date().getDate()
  );
  const [birthHour, setBirthHour] = useState<number>(
    customerInfo?.birthHour || new Date().getHours()
  );
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    try {
      if (!user) {
        toast.error(messages.errors.pleaseLogin);
        setIsPending(false);
        return;
      }

      const formData = new FormData();

      // 手动设置所有需要的字段
      formData.set("gender", gender);
      formData.set("birthYear", birthYear.toString());
      formData.set("birthMonth", birthMonth.toString());
      formData.set("birthDay", birthDay.toString());
      formData.set("birthHour", birthHour.toString());
      formData.set("userId", user?.uuid);
      formData.set("type", type);

      const result = await createCustomerInput(formData);

      if (result.message === "Success" && result.values?.customerInfoId) {
        toast.success(messages.button.saveSuccess); // 添加成功提示
        onSuccess?.(formData); // 调用成功回调
        return;
      }

      //如果没有保存成功，提示原因
      setIsPending(false);
      setState(result);
    } catch (error) {
      console.error("Error:", error);
      toast.error(messages.errors.operationFailed);
      setIsPending(false);
    }
  };

  return (
    <section className="pb-8 pt-2 md:pb-16 md:pt-4">
      <div className="container px-4 md:px-6 max-w-2xl">
        <form noValidate onSubmit={handleSubmit}>
          <Card className="p-4 md:p-6">
            <CardContent className="space-y-8 p-0">
              {/* 出生日期和时间 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label className="text-base">
                      {messages.form.birthDate.label}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <InfoCircledIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer hover:text-primary" />
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-2 text-sm">
                        {messages.form.birthDate.info}
                      </PopoverContent>
                    </Popover>
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
                  <div className="flex items-center">
                    <Label className="text-base">
                      {messages.form.birthTime.label}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <InfoCircledIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer hover:text-primary" />
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-2 text-sm">
                        {messages.form.birthTime.info}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <HourSelect value={birthHour} onChange={setBirthHour} />
                </div>
              </div>

              {/* 性别选择 */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label className="text-base">
                    {messages.form.gender.label}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer hover:text-primary" />
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2 text-sm">
                      {messages.form.gender.info}
                    </PopoverContent>
                  </Popover>
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
                    className="flex-1 border border-input data-[state=on]:border-0 
                    data-[state=on]:bg-orange-500 data-[state=on]:text-white rounded-md text-base"
                  >
                    <IoMale className="w-5 h-5 mr-2" />
                    {messages.form.gender.male}
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="female"
                    className="flex-1 border border-input data-[state=on]:border-0 
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
            </CardContent>
          </Card>
          {/* 按钮组 */}
          <div className="space-y-4 pt-4">
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-base"
              disabled={isPending}
            >
              {isPending ? messages.button.submitting : messages.button.submit}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
