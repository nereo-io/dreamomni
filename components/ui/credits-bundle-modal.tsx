"use client";

import { useState } from "react";
import { X, Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

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
}

// Bundle options configuration
export const BUNDLE_OPTIONS: BundleItem[] = [
  {
    id: "bundle-20",
    name: "Seedance 200 Credits Pack",
    credits: 200,
    price: "$20",
    amount: 2000,
  },
  {
    id: "bundle-40",
    name: "Seedance 400 Credits Pack",
    credits: 400,
    price: "$40",
    amount: 4000,
  },
  {
    id: "bundle-60",
    name: "Seedance 600 Credits Pack",
    credits: 600,
    price: "$60",
    amount: 6000,
  },
  {
    id: "bundle-100",
    name: "Seedance 1000 Credits Pack",
    credits: 1000,
    price: "$100",
    amount: 10000,
  },
  {
    id: "bundle-200",
    name: "Seedance 2000 Credits Pack",
    credits: 2000,
    price: "$200",
    amount: 20000,
  },
];

export default function CreditsBundleModal({
  isOpen,
  onClose,
  onPurchase,
  isLoading,
}: CreditsBundleModalProps) {
  const [selectedBundle, setSelectedBundle] = useState<BundleItem>(
    BUNDLE_OPTIONS[1] // Default to $40 pack
  );

  const t = useTranslations("creditsBundle");

  const handlePurchase = () => {
    if (selectedBundle && !isLoading) {
      onPurchase(selectedBundle);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden z-[10000]" overlayClassName="z-[10000]">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 md:p-8">
          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-4">
            {t("title")}
          </h2>

          {/* Description */}
          <p className="text-center text-muted-foreground text-base line-clamp-2 mb-8">
            {t("description")}{" "}
            <span className="font-semibold text-foreground">
              {t("expireNote")}
            </span>
          </p>

          {/* Credits Amount Display */}
          <div className="text-center mb-8">
            <span className="text-4xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              {selectedBundle.credits.toLocaleString()}
            </span>
            <span className="text-4xl sm:text-4xl md:text-5xl font-bold tracking-tight ml-2">
              {t("credits")}
            </span>
          </div>

          {/* Price Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {BUNDLE_OPTIONS.map((bundle) => (
              <Button
                key={bundle.id}
                variant={selectedBundle.id === bundle.id ? "default" : "outline"}
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

        {/* Footer with Buttons */}
        <div className="border-t bg-muted/30 px-4 sm:px-6 md:px-8 py-4">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
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
                t("continueToPayment")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
