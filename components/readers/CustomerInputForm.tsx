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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FormData {
  gender: string;
  birthDate: string;
  birthTime: string;
}

interface Props {
  messages: ReaderPage;
  onSuccess?: () => void;
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
  const [name, setName] = useState(customerInfo?.name || "");
  const [relationshipStatus, setRelationshipStatus] = useState(
    customerInfo?.relationshipStatus || ""
  );
  const [jobStatus, setJobStatus] = useState(customerInfo?.jobStatus || "");
  const [additionalInfo, setAdditionalInfo] = useState(
    customerInfo?.additionalInfo || ""
  );

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
      formData.set("userId", user?.uuid || "");
      formData.set("name", name);
      formData.set("relationshipStatus", relationshipStatus);
      formData.set("jobStatus", jobStatus);
      formData.set("additionalInfo", additionalInfo);
      formData.set("type", type);

      const result = await createCustomerInput(formData);

      if (result.message === "Success" && result.values?.customerInfoId) {
        toast.success(messages.button.saveSuccess); // 添加成功提示
        onSuccess?.(); // 调用成功回调
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
              {/* 新增字段：用户姓名 */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label className="text-base">
                    {messages.form.name?.label}
                    <span className="text-sm text-muted-foreground ml-2">
                      {messages.form.optional}
                    </span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer hover:text-primary" />
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2 text-sm">
                      {messages.form.name?.info}
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={messages.form.name?.placeholder}
                />
              </div>
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

              {/* 感情状态和工作状态并排 */}
              <div className="grid grid-cols-2 gap-2">
                {/* 感情状态 */}
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Label className="text-sm md:text-base">
                      {messages.form.relationshipStatus?.label || "感情状态"}
                      <span className="text-xs text-muted-foreground ml-1">
                        {messages.form.optional}
                      </span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <InfoCircledIcon className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-pointer hover:text-primary" />
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2 text-xs">
                        {messages.form.relationshipStatus?.info}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Select
                    value={relationshipStatus}
                    onValueChange={setRelationshipStatus}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue
                        placeholder={
                          messages.form.relationshipStatus?.placeholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">
                        {messages.form.relationshipStatus?.options?.single}
                      </SelectItem>
                      <SelectItem value="in_relationship">
                        {messages.form.relationshipStatus?.options?.dating}
                      </SelectItem>
                      <SelectItem value="married">
                        {messages.form.relationshipStatus?.options?.married}
                      </SelectItem>
                      <SelectItem value="divorced">
                        {messages.form.relationshipStatus?.options?.divorced}
                      </SelectItem>
                      <SelectItem value="widowed">
                        {messages.form.relationshipStatus?.options?.widowed}
                      </SelectItem>
                      <SelectItem value="complicated">
                        {messages.form.relationshipStatus?.options?.complicated}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 工作状态 */}
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Label className="text-sm md:text-base">
                      {messages.form.jobStatus?.label || "工作状态"}
                      <span className="text-xs text-muted-foreground ml-1">
                        {messages.form.optional}
                      </span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <InfoCircledIcon className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-pointer hover:text-primary" />
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2 text-xs">
                        {messages.form.jobStatus?.info}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Select value={jobStatus} onValueChange={setJobStatus}>
                    <SelectTrigger className="text-sm">
                      <SelectValue
                        placeholder={messages.form.jobStatus?.placeholder}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">
                        {messages.form.jobStatus?.options?.employed}
                      </SelectItem>
                      <SelectItem value="self_employed">
                        {messages.form.jobStatus?.options?.selfEmployed}
                      </SelectItem>
                      <SelectItem value="unemployed">
                        {messages.form.jobStatus?.options?.unemployed}
                      </SelectItem>
                      <SelectItem value="student">
                        {messages.form.jobStatus?.options?.student}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 新增字段：其他信息补充 */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label className="text-base">
                    {messages.form.additionalInfo?.label}
                    <span className="text-sm text-muted-foreground ml-2">
                      {messages.form.optional}
                    </span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer hover:text-primary" />
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2 text-sm">
                      {messages.form.additionalInfo?.info}
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder={messages.form.additionalInfo?.placeholder}
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
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
