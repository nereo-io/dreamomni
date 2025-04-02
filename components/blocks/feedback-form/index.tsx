"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MailIcon, Copy, LogIn } from "lucide-react";
import { FeedbackFormTranslations } from "@/types/blocks/feedback-form";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/app";

// 表单验证架构
const createFormSchema = (messages: any) =>
  z.object({
    feedbackType: z.string().min(1, {
      message:
        messages?.validation?.feedbackTypeRequired ||
        "Please select a feedback type",
    }),
    content: z.string().min(10, {
      message:
        messages?.validation?.contentRequired ||
        "Please describe your feedback in detail (minimum 10 characters)",
    }),
  });

export interface FeedbackFormProps {
  translations: FeedbackFormTranslations;
  onSubmitSuccess?: () => void;
  urgentEmail?: string;
}

export default function FeedbackForm({
  translations,
  onSubmitSuccess,
  urgentEmail = "jasper@bazi-ai.com",
}: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, setShowSignModal } = useAppContext();

  const formSchema = createFormSchema(translations);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedbackType: "",
      content: "",
    },
  });

  // 处理登录
  const handleLogin = () => {
    setShowSignModal(true);
  };

  // 提交表单
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // 检查用户是否登录
    if (!user) {
      toast.error(
        translations.messages.loginRequired || "Please login to submit feedback"
      );
      handleLogin();
      return;
    }

    setIsSubmitting(true);

    try {
      // 通过API提交反馈数据
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackType: data.feedbackType,
          content: data.content,
          email: user?.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit feedback");
      }

      toast.success(translations.messages.success);
      form.reset();

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error("提交反馈失败:", error);
      toast.error(translations.messages.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 复制紧急联系邮箱到剪贴板
  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(urgentEmail);
    toast.success(translations.messages.emailCopied);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
        {translations.title}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 反馈类型 */}
          <FormField
            control={form.control}
            name="feedbackType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">
                  {translations.feedbackType.label}
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full py-6 px-4 text-base bg-background border-border hover:bg-accent rounded-md">
                      <SelectValue
                        placeholder={translations.feedbackType.placeholder}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {translations.feedbackType.options.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 反馈内容 */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">
                  {translations.content.label}
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={translations.content.placeholder}
                    className="min-h-[150px] py-4 px-4 text-base bg-background border-border hover:bg-accent rounded-md resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 提交按钮 */}
          <Button
            type="submit"
            className="w-full py-6 text-base font-medium rounded-md"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? translations.submittingButton
              : translations.submitButton}
          </Button>
        </form>
      </Form>

      {/* 紧急联系信息 */}
      <div className="mt-8 p-6 border border-border rounded-md bg-card">
        <div className="flex items-start">
          <MailIcon className="h-6 w-6 text-primary mr-3 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-primary mb-2">
              {translations.urgentContact.title}
            </h3>
            <p className="text-card-foreground mb-3">
              {translations.urgentContact.description.replace(
                "{email}",
                urgentEmail
              )}
            </p>
            <Button
              variant="outline"
              onClick={copyEmailToClipboard}
              className={cn(
                "flex items-center gap-2 border-border hover:bg-accent"
              )}
            >
              <Copy className="h-4 w-4" />
              {translations.urgentContact.copyButton}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
