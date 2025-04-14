"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UserIcon, HeartHandshakeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface CreditExhaustedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditExhaustedModal({
  open,
  onOpenChange,
}: CreditExhaustedModalProps) {
  const router = useRouter();
  const t = useTranslations("credit_exhausted_modal");
  const [personalChecked, setPersonalChecked] = useState(false);
  const [dualChecked, setDualChecked] = useState(false);

  const handlePricingClick = () => {
    router.push("#pricing");
    onOpenChange(false);
  };

  const handleShareClick = () => {
    router.push("/my-invites");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-5 rounded-2xl max-h-[90vh] overflow-auto">
        {/* 情绪唤起区 */}
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-primary leading-snug">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        {/* 功能简介 */}
        <div className="space-y-3 text-sm mt-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <UserIcon className="w-5 h-5" />
              <label
                htmlFor="personal-analysis"
                className="font-semibold cursor-pointer"
              >
                {t("lifetime_analysis.title")}
              </label>
            </div>
            <ul className="list-disc pl-5 space-y-1 mt-1 text-muted-foreground">
              <li>{t("lifetime_analysis.description1")}</li>
              <li>{t("lifetime_analysis.description2")}</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <HeartHandshakeIcon className="w-5 h-5 text-rose-500" />
              <label
                htmlFor="dual-analysis"
                className="font-semibold cursor-pointer"
              >
                {t("dual_chart.title")}
              </label>
            </div>
            <p className="text-muted-foreground">
              {t("dual_chart.description")}
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1 text-muted-foreground">
              <li>{t("use_cases.relationship")}</li>
              <li>{t("use_cases.family")}</li>
              <li>{t("use_cases.career")}</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="border-t pt-4 space-y-2 mt-4">
          <p className="text-center font-medium text-sm">
            {t("choice_section.title")}
          </p>

          <Button
            variant="default"
            className="w-full py-2 h-auto font-semibold text-sm rounded-xl"
            onClick={handlePricingClick}
          >
            {t("choice_section.premium.title")}（
            {t("choice_section.premium.description")}）
          </Button>

          <Button
            variant="outline"
            className="w-full py-2 h-auto font-medium text-sm rounded-xl border-border hover:border-input text-foreground"
            onClick={handleShareClick}
          >
            {t("choice_section.share.title")}（
            {t("choice_section.share.description")}）
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {t("choice_section.share.tips")}
          </p>
        </div>

        {/* 提示 */}
        {/* <p className="text-xs text-center text-muted-foreground mt-2 whitespace-pre-line">
          {t("footer_text")}
        </p> */}
      </DialogContent>
    </Dialog>
  );
}
