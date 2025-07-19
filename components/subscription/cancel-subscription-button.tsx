"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CancelSubscriptionButtonProps {
  subscriptionId: string;
  onCancel?: () => void;
}

export function CancelSubscriptionButton({
  subscriptionId,
  onCancel,
}: CancelSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("subscription");

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const result = await response.json();
      
      if (result.code === 0) {
        // 成功取消
        toast.success(t("cancelSuccess"), {
          description: t("cancelSuccessDescription"),
          duration: 5000,
        });
        onCancel?.();
        setTimeout(() => {
          window.location.reload(); // 延迟刷新，让用户看到 toast
        }, 1000);
      } else {
        toast.error(t("cancelFailed"), {
          description: result.message || t("cancelFailedDescription"),
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error(t("networkError"), {
        description: t("networkErrorDescription"),
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          {isLoading ? t("canceling") : t("cancel")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("cancelTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("cancelDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("keepSubscription")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={isLoading}>
            {isLoading ? t("canceling") : t("confirmCancel")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}