"use client";

import React, { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";

interface CaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptchaComplete: (token: string) => void;
  isSubmitting?: boolean;
}

export function CaptchaModal({
  isOpen,
  onClose,
  onCaptchaComplete,
  isSubmitting = false,
}: CaptchaModalProps) {
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [captchaError, setCaptchaError] = useState<string>("");

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError("");
  };

  const handleCaptchaError = (error: string) => {
    setCaptchaError("验证失败，请重试");
    setCaptchaToken("");
  };

  const handleSubmit = () => {
    if (captchaToken) {
      onCaptchaComplete(captchaToken);
    }
  };

  const handleClose = () => {
    setCaptchaToken("");
    setCaptchaError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            安全验证
          </DialogTitle>
          <DialogDescription>
            为了防止滥用，请完成安全验证后继续生成视频
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* CAPTCHA组件 */}
          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={handleCaptchaSuccess}
              onError={handleCaptchaError}
              onExpire={() => {
                setCaptchaToken("");
                setCaptchaError("验证已过期，请重新验证");
              }}
              options={{
                size: "normal",
                action: "video-generation",
                cData: "captcha-modal",
              }}
            />
          </div>

          {/* 错误提示 */}
          {captchaError && (
            <div className="text-sm text-red-600 text-center">
              {captchaError}
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!captchaToken || isSubmitting}
              className="min-w-24"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                "开始生成"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}