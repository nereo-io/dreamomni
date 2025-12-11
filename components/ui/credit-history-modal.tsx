"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/ui/local-time";
import { Credit } from "@/types/credit";
import Empty from "@/components/blocks/empty";
import { Loader2, X } from "lucide-react";

interface CreditHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditHistoryModal({
  open,
  onOpenChange,
}: CreditHistoryModalProps) {
  const router = useRouter();
  const t = useTranslations("credit_history_modal");
  const tTransType = useTranslations("trans_type");

  const [credits, setCredits] = useState<Credit[]>([]);
  const [leftCredits, setLeftCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);

      // Fetch both credit history and current balance in parallel
      Promise.all([
        fetch("/api/credits/history?limit=20").then((res) => res.json()),
        fetch("/api/credits").then((res) => res.json()),
      ])
        .then(([historyData, balanceData]) => {
          if (historyData.code === 0) {
            setCredits(historyData.data.credits || []);
          } else {
            setError(historyData.message || t("error"));
          }

          if (balanceData.code === 0) {
            setLeftCredits(balanceData.data.credits || 0);
          }
        })
        .catch((err) => {
          console.error("Failed to load credit data:", err);
          setError(t("error"));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, t]);

  const handleViewAll = () => {
    router.push("/my-credits");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[750px] p-0 flex flex-col">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 disabled:pointer-events-none z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <DialogHeader className="p-6 pb-4 space-y-2">
          <DialogTitle className="text-xl text-left">
            {t("title")}
          </DialogTitle>

          {/* Current Balance - simple text with accent */}
          <div className="flex items-center">
            <span className="text-sm text-white">
              {t("current_balance")}: {leftCredits !== null ? leftCredits : "-"}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">{t("loading")}</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="py-4 text-center text-red-500 flex-1 flex items-center justify-center">
              {error}
            </div>
          )}

          {/* Table - No Scrollbar */}
          {!isLoading && !error && credits.length > 0 && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto scrollbar-hide">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="border-gray-700 hover:bg-transparent">
                      <TableHead className="text-center text-gray-400">
                        {t("type")}
                      </TableHead>
                      <TableHead className="text-center text-gray-400">
                        {t("credits")}
                      </TableHead>
                      <TableHead className="text-center text-gray-400">
                        {t("date")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credits.map((credit) => (
                      <TableRow
                        key={credit.trans_no}
                        className="border-gray-700 hover:bg-gray-800/50"
                      >
                        <TableCell className="text-center text-gray-300">
                          {tTransType(credit.trans_type, {
                            default: credit.trans_type,
                          })}
                        </TableCell>
                        <TableCell
                          className={`text-center font-medium ${
                            credit.credits > 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {credit.credits > 0 ? "+" : ""}
                          {credit.credits}
                        </TableCell>
                        <TableCell className="text-center text-gray-400 text-sm">
                          <LocalTime date={credit.created_at} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && credits.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <Empty message={t("empty")} />
            </div>
          )}

          {/* View Full History Button - at bottom with gradient hint */}
          {!isLoading && !error && credits.length >= 20 && (
            <div className="relative mt-auto">
              <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              <div className="pt-4 bg-background/95 backdrop-blur-sm">
                <Button
                  variant="link"
                  onClick={handleViewAll}
                  className="text-sm h-auto p-0 w-full justify-center"
                >
                  {t("view_all")} →
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
