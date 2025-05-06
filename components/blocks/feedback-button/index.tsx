"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RiWechatFill } from "react-icons/ri";
import { MessageCircle } from "lucide-react";
import Image from "next/image";

interface FeedbackButtonProps {
  className?: string;
}

export default function FeedbackButton({ className }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className={className}
      >
        <RiWechatFill className="w-4 h-4 rounded-full" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md mx-auto p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              欢迎加入BaziAI讨论群！
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="bg-white p-4 rounded-md mb-3">
              <Image
                src="/imgs/wechat/wechat-group-qr.png"
                alt="WeChat Group QR Code"
                width={280}
                height={280}
                className="mx-auto"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
