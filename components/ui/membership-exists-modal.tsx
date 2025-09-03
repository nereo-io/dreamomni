"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface MembershipExistsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSubscription?: () => void;
}

export default function MembershipExistsModal({
  isOpen,
  onClose,
  onViewSubscription,
}: MembershipExistsModalProps) {
  const t = useTranslations("membershipModal");

  const handleViewSubscription = () => {
    onClose();
    if (onViewSubscription) {
      onViewSubscription();
    } else {
      window.location.href = "/membership";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-center">
            {t("description")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              {t("explanation")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
            <Button className="w-full sm:flex-1" onClick={handleViewSubscription}>
              {t("viewSubscription")}
            </Button>
            <Button variant="outline" className="w-full sm:flex-1" onClick={onClose}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
