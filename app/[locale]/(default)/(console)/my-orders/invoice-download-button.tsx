"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InvoiceDownloadButtonProps = {
  orderNo: string;
  defaultTitle: string;
  defaultEmail: string;
};

const sanitizeFilename = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, "_");

const extractErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // Ignore JSON parsing failures and fall back to status text.
  }

  return response.statusText;
};

export function InvoiceDownloadButton({
  orderNo,
  defaultTitle,
  defaultEmail,
}: InvoiceDownloadButtonProps) {
  const t = useTranslations("my_orders.invoice_dialog");
  const signModalT = useTranslations("sign_modal");
  const [open, setOpen] = useState(false);
  const [invoiceTitle, setInvoiceTitle] = useState(defaultTitle);
  const [invoiceEmail, setInvoiceEmail] = useState(defaultEmail);
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const resetForm = () => {
    setInvoiceTitle(defaultTitle);
    setInvoiceEmail(defaultEmail);
    setInvoiceAddress("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetForm();
    }
    setOpen(nextOpen);
  };

  const handleConfirm = async () => {
    const trimmedTitle = invoiceTitle.trim();
    const trimmedEmail = invoiceEmail.trim();
    const trimmedAddress = invoiceAddress.trim();

    if (!trimmedTitle) {
      toast.error(t("name_required"));
      return;
    }

    if (!trimmedEmail) {
      toast.error(t("email_required"));
      return;
    }

    const searchParams = new URLSearchParams({
      title: trimmedTitle,
      email: trimmedEmail,
    });

    if (trimmedAddress) {
      searchParams.set("address", trimmedAddress);
    }

    const invoiceUrl = `/api/orders/${encodeURIComponent(
      orderNo
    )}/invoice?${searchParams.toString()}`;

    setIsDownloading(true);

    try {
      const response = await fetch(invoiceUrl, { method: "GET" });

      if (!response.ok) {
        const message = await extractErrorMessage(response);
        throw new Error(message || t("download_failed"));
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `invoice-${sanitizeFilename(orderNo)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t("download_failed");
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        {t("download")}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor={`invoice-title-${orderNo}`}>{t("name_label")}</Label>
              <Input
                id={`invoice-title-${orderNo}`}
                value={invoiceTitle}
                onChange={(event) => setInvoiceTitle(event.target.value)}
                placeholder={t("name_placeholder")}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`invoice-email-${orderNo}`}>
                {t("email_label")}
              </Label>
              <Input
                id={`invoice-email-${orderNo}`}
                type="email"
                value={invoiceEmail}
                onChange={(event) => setInvoiceEmail(event.target.value)}
                placeholder={t("email_placeholder")}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`invoice-address-${orderNo}`}>
                {t("address_label")}
              </Label>
              <Textarea
                id={`invoice-address-${orderNo}`}
                value={invoiceAddress}
                onChange={(event) => setInvoiceAddress(event.target.value)}
                placeholder={t("address_placeholder")}
                className="min-h-[96px]"
              />
              <p className="text-sm text-muted-foreground">{t("address_hint")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDownloading}
            >
              {signModalT("cancel_title")}
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={isDownloading}>
              {isDownloading ? t("downloading") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
