"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ManageSubscriptionButtonProps {
  customerId: string;
  className?: string;
}

export function ManageSubscriptionButton({
  customerId,
  className,
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error managing subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleManageSubscription}
      disabled={isLoading}
      className={cn(
        "text-sm underline disabled:opacity-50 disabled:no-underline",
        className
      )}
    >
      {isLoading ? t("membership.loading") : t("membership.manage_subscription")}
    </button>
  );
}
