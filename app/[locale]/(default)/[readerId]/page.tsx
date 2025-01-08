"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { createCustomerInput, State } from "@/services/customerInputAction"
import { MapPin, User, CalendarDays, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

interface FormData {
    name: string;
    gender: string;
    birthDate: string;
    birthTime: string;
}

export default function CustomerInput() {
  const router = useRouter();
  const initialState: State = { message: null, errors: {}, values: {} as FormData };
  const [state, setState] = useState(initialState);
  const [gender, setGender] = useState(state.values?.gender || '');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsPending(true);

    // 校验数据
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const result = await createCustomerInput(state, formData);

    setState(result);
    setIsPending(false);

    if (result.message === 'Success' && result.values?.customerId) {
      const readerId = window.location.pathname.split('/')[1];
      router.push(`/${readerId}/${result.values.customerId}`);
    }
  };

  return (
    <div>
      <main className="container max-w-lg mx-auto my-10 py-10 px-4">
        <form noValidate onSubmit={handleSubmit} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-center">
                基本信息
              </CardTitle>
              <CardDescription className="text-center">
                我们重视您的隐私，所有信息仅用于解读分析
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 姓名输入 */}
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="请输入您的姓名"
                  defaultValue={state.values?.name || ''}
                  className={cn(
                    "w-full",
                    state.errors?.name && "border-danger-500 focus-visible:ring-danger-500"
                  )}
                />
                {state.errors?.name && (
                  <p className="text-sm text-destructive">{state.errors.name[0]}</p>
                )}

              </div>

              {/* 性别选择 */}
              <div className="space-y-2">
                <Label>性别</Label>
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
                    className="flex-1 data-[state=on]:bg-primary/50"
                  >
                    <User className="w-4 h-4 mr-2" />
                    男
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="female"
                    className="flex-1 data-[state=on]:bg-primary/50"
                  >
                    <User className="w-4 h-4 mr-2" />
                    女
                  </ToggleGroupItem>
                </ToggleGroup>
                {state.errors?.gender && (
                  <p className="text-sm text-destructive">{state.errors.gender[0]}</p>
                )}
              </div>

              {/* 出生日期和时间 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">出生日期</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      defaultValue={state.values?.birthDate || ''}
                      className={cn(
                        "w-full pl-10",
                        state.errors?.birthDate && "border-danger-500"
                      )}
                    />
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                  {state.errors?.birthDate && (
                    <p className="text-sm text-destructive">{state.errors.birthDate[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthTime">出生时间</Label>
                  <div className="relative">
                    <Input
                      type="time"
                      id="birthTime"
                      name="birthTime"
                      defaultValue={state.values?.birthTime || ''}
                      className={cn(
                        "w-full pl-10",
                        state.errors?.birthTime && "border-danger-500"
                      )}
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                  {state.errors?.birthTime && (
                    <p className="text-sm text-destructive">{state.errors.birthTime[0]}</p>
                  )}
                </div>
              </div>

              

              {/* 按钮组 */}
              <div className="space-y-4 pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? "处理中..." : "获取我的解读"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push('/')}
                >
                  返回
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  )
}