import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomerInputForm from "./CustomerInputForm";
import { ReaderPage } from "@/types/pages/reader";
import { CustomerInfo } from "@/types/customer";

interface Props {
  messages: ReaderPage;
  customerInfo?: CustomerInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CustomerInputFormModal({
  messages,
  customerInfo,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 text-center">
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              {messages.title}
            </span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            {messages.description}
          </p>
        </DialogHeader>
        <CustomerInputForm
          messages={messages}
          onSuccess={() => {
            onSuccess?.();
            onOpenChange(false);
          }}
          customerInfo={customerInfo}
        />
      </DialogContent>
    </Dialog>
  );
}
