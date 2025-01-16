"use client"

import React, { useState } from "react"
import { useRouter, useParams } from 'next/navigation'
import { createCustomerInput, State } from "@/services/customerInputAction"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { logInfo } from "@/lib/utils/logger"
import { DatePicker } from "@/components/ui/date-picker"
import { HourSelect } from "@/components/ui/hour-select"
import { IoMale, IoFemale } from "react-icons/io5"
import { ReaderPage } from "@/types/pages/reader"

interface FormData {
    name: string;
    gender: string;
    birthDate: string;
    birthTime: string;
}

interface Props {
  messages: ReaderPage;
  selectedQuestion?: string;
}

export default function CustomerInputForm({ messages, selectedQuestion }: Props) {
  const router = useRouter();
  const params = useParams();
  const initialState: State = { message: null, errors: {}, values: {} as FormData };
  const [state, setState] = useState(initialState);
  const [gender, setGender] = useState(state.values?.gender || '');
  const [birthYear, setBirthYear] = useState<number>(new Date().getFullYear() - 18);
  const [birthMonth, setBirthMonth] = useState<number>(new Date().getMonth() + 1);
  const [birthDay, setBirthDay] = useState<number>(new Date().getDate());
  const [birthHour, setBirthHour] = useState<number>(new Date().getHours());
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    
    formData.set('birthYear', birthYear.toString());
    formData.set('birthMonth', birthMonth.toString());
    formData.set('birthDay', birthDay.toString());
    formData.set('birthHour', birthHour.toString());
    
    if (selectedQuestion) {
      formData.set('question', selectedQuestion);
    }

    const result = await createCustomerInput(state, formData);

    setState(result);
    setIsPending(false);

    if (result.message === 'Success' && result.values?.customerId) {
      const { locale } = params;
      const path = locale 
        ? `/${locale}/destiny/${result.values.customerId}`
        : `/destiny/${result.values.customerId}`;
        
      logInfo(`Redirecting to: ${path}`);
      router.push(path);
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
          <p className="text-base md:text-lg text-muted-foreground">{messages.description}</p>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          <Card className="p-4 md:p-6">
            <CardContent className="space-y-6 p-0">
              {/* 姓名输入 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">{messages.form.name.label}</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={messages.form.name.placeholder}
                  defaultValue={state.values?.name || ''}
                  className={cn(
                    "w-full text-base",
                    state.errors?.name && "border-danger-500 focus-visible:ring-danger-500"
                  )}
                />
                {state.errors?.name && (
                  <p className="text-sm text-destructive">{state.errors.name[0]}</p>
                )}
              </div>

              {/* 性别选择 */}
              <div className="space-y-2">
                <Label className="text-base">{messages.form.gender.label}</Label>
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
                    className="flex-1 data-[state=on]:bg-orange-500 data-[state=on]:text-white rounded-md text-base"
                  >
                    <IoMale className="w-5 h-5 mr-2" />
                    {messages.form.gender.male}
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="female"
                    className="flex-1 data-[state=on]:bg-orange-500 data-[state=on]:text-white rounded-md text-base"
                  >
                    <IoFemale className="w-5 h-5 mr-2" />
                    {messages.form.gender.female}
                  </ToggleGroupItem>
                </ToggleGroup>
                {state.errors?.gender && (
                  <p className="text-sm text-destructive">{state.errors.gender[0]}</p>
                )}
              </div>

              {/* 出生日期和时间 */}
              <div className="space-y-2">
                <Label className="text-base">{messages.form.birthDate.label}</Label>
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
                <Label className="text-base">{messages.form.birthTime.label}</Label>
                <HourSelect
                  value={birthHour}
                  onChange={setBirthHour}
                />
              </div>

              {/* 按钮组 */}
              <div className="space-y-4 pt-4">
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-base"
                  disabled={isPending}
                >
                  {isPending ? messages.button.submitting : messages.button.submit}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-base hover:bg-orange-500/10"
                  onClick={() => router.push('/')}
                >
                  {messages.button.back}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </section>
  )
} 