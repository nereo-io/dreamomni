"use client";

import React, { useState, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("captcha");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [captchaError, setCaptchaError] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError("");
    setIsVerifying(true);
    
    // 自动提交，无需用户再点击按钮
    onCaptchaComplete(token);
  };

  const handleCaptchaError = () => {
    setCaptchaError(t("verificationFailed"));
    setCaptchaToken("");
    setIsVerifying(false);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken("");
    setCaptchaError(t("verificationExpired"));
    setIsVerifying(false);
  };

  const handleClose = () => {
    setCaptchaToken("");
    setCaptchaError("");
    setIsVerifying(false);
    onClose();
  };

  // 重置状态当模态框打开时
  useEffect(() => {
    if (isOpen) {
      setCaptchaToken("");
      setCaptchaError("");
      setIsVerifying(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* CAPTCHA组件 */}
          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={handleCaptchaSuccess}
              onError={handleCaptchaError}
              onExpire={handleCaptchaExpire}
              options={{
                size: "normal",
                action: "video-generation",
                cData: "captcha-modal",
              }}
            />
          </div>

          {/* 状态显示 */}
          {isVerifying && !isSubmitting && (
            <div className="text-sm text-blue-600 text-center flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("verifying")}
            </div>
          )}

          {isSubmitting && (
            <div className="text-sm text-green-600 text-center flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在生成视频...
            </div>
          )}

          {/* 错误提示 */}
          {captchaError && (
            <div className="text-sm text-red-600 text-center">
              {captchaError}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}