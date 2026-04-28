"use client";

import { useState } from "react";
import { Crown, Loader } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { getBundleBonusCreditsForTier } from "@/config/products";

type BonusTier = "mini" | "standard" | "plus" | "max";
type BonusRow = {
  id: string;
  tiers: BonusTier[];
  label: string;
  credits: number;
};

export interface BundleItem {
  id: string;
  name: string;
  credits: number;
  price: string;
  amount: number; // cents
}

interface CreditsBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (bundle: BundleItem) => void;
  isLoading: boolean;
  bonusPlanLabels?: {
    mini?: string;
    standard?: string;
    plus?: string;
    max?: string;
  };
}

export const BUNDLE_OPTIONS: BundleItem[] = [
  {
    id: "bundle-20",
    name: "Seedance Credits Pack",
    credits: 200,
    price: "$20",
    amount: 2000,
  },
  {
    id: "bundle-40",
    name: "Seedance Credits Pack",
    credits: 400,
    price: "$40",
    amount: 4000,
  },
  {
    id: "bundle-100",
    name: "Seedance Credits Pack",
    credits: 1000,
    price: "$100",
    amount: 10000,
  },
  {
    id: "bundle-200",
    name: "Seedance Credits Pack",
    credits: 2000,
    price: "$200",
    amount: 20000,
  },
  {
    id: "bundle-500",
    name: "Seedance Credits Pack",
    credits: 5000,
    price: "$500",
    amount: 50000,
  },
  {
    id: "bundle-1000",
    name: "Seedance Credits Pack",
    credits: 10000,
    price: "$1000",
    amount: 100000,
  },
];

function combinePlanLabels(firstLabel: string, secondLabel: string) {
  const suffixMatch = firstLabel.match(/\s+Plan$/i);

  if (!suffixMatch || !secondLabel.match(/\s+Plan$/i)) {
    return `${firstLabel} & ${secondLabel}`;
  }

  const firstName = firstLabel.replace(/\s+Plan$/i, "").trim();
  const secondName = secondLabel.replace(/\s+Plan$/i, "").trim();

  return `${firstName} & ${secondName} Plan`;
}

export default function CreditsBundleModal({
  isOpen,
  onClose,
  onPurchase,
  isLoading,
  bonusPlanLabels,
}: CreditsBundleModalProps) {
  const [selectedBundle, setSelectedBundle] = useState<BundleItem>(
    BUNDLE_OPTIONS[1],
  );

  const t = useTranslations("creditsBundle");
  const standardLabel = bonusPlanLabels?.standard || "Standard Plan";
  const plusLabel = bonusPlanLabels?.plus || "Plus Plan";
  const maxLabel = bonusPlanLabels?.max || "Max Plan";
  const plusCredits = getBundleBonusCreditsForTier(selectedBundle.id, "plus");
  const maxCredits = getBundleBonusCreditsForTier(selectedBundle.id, "max");
  const bonusRows: BonusRow[] = [
    {
      id: "standard",
      tiers: ["standard"] as BonusTier[],
      label: standardLabel,
      credits: getBundleBonusCreditsForTier(selectedBundle.id, "standard"),
    },
    ...(plusCredits === maxCredits
      ? [
          {
            id: "plus-max",
            tiers: ["plus", "max"] as BonusTier[],
            label: combinePlanLabels(plusLabel, maxLabel),
            credits: plusCredits,
          },
        ]
      : [
          { id: "plus", tiers: ["plus"] as BonusTier[], label: plusLabel },
          { id: "max", tiers: ["max"] as BonusTier[], label: maxLabel },
        ].map((item) => ({
          ...item,
          credits: getBundleBonusCreditsForTier(
            selectedBundle.id,
            item.tiers[0],
          ),
        }))),
  ].filter((item) => item.credits > 0);

  const miniCredits = getBundleBonusCreditsForTier(selectedBundle.id, "mini");
  if (miniCredits > 0) {
    bonusRows.unshift({
      id: "mini",
      tiers: ["mini"] as BonusTier[],
      label: bonusPlanLabels?.mini || "Mini Plan",
      credits: miniCredits,
    });
  }

  const handlePurchase = () => {
    if (selectedBundle && !isLoading) {
      onPurchase(selectedBundle);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-xl p-0 gap-0 overflow-hidden z-[10000]"
        overlayClassName="z-[10000]"
      >
        <div className="p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-center mb-4">
            {t("title")}
          </h2>

          <p className="text-center text-base text-muted-foreground mb-8">
            {t.rich("expireNote", {
              highlight: (chunks) => (
                <span className="text-foreground font-semibold">
                  {chunks}
                </span>
              ),
            })}
          </p>

          <div className="text-center mb-8">
            <span className="text-4xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              {selectedBundle.credits.toLocaleString()}
            </span>
            <span className="text-4xl sm:text-4xl md:text-5xl font-bold tracking-tight ml-2">
              {t("credits")}
            </span>

            {bonusRows.length > 0 && (
              <div className="mx-auto mt-4 max-w-sm text-left">
                <div className="mb-2 border-t border-white/10" />
                <div className="mt-4 space-y-2">
                  {bonusRows.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-primary">
                        {t("bonusCreditsShort", {
                          credits: item.credits.toLocaleString(),
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {BUNDLE_OPTIONS.map((bundle) => (
              <Button
                key={bundle.id}
                variant={
                  selectedBundle.id === bundle.id ? "default" : "outline"
                }
                className={`w-full ${
                  selectedBundle.id === bundle.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted"
                }`}
                onClick={() => setSelectedBundle(bundle)}
              >
                {bundle.price}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t bg-muted/30 px-4 sm:px-6 md:px-8 py-4">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!selectedBundle || isLoading}
              className="min-w-[160px]"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("buyCredits")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
