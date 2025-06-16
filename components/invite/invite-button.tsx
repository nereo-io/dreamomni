"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import Link from "next/link";

export default function InviteButton() {
  const { user } = useAppContext();

  const handleCopyInviteLink = () => {
    if (!user?.invite_code) {
      toast.error("Please set your invite code first");
      // Redirect to invite setup page
      window.location.href = "/my-invites";
      return;
    }
    
    const inviteLink = `${process.env.NEXT_PUBLIC_WEB_URL}/i/${user.invite_code}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast.success("Invite link copied!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  // Don't show if user is not logged in
  if (!user?.uuid) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1 text-xs"
          >
            <Icon name="RiGiftLine" className="size-4" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Invite a friend and earn 5 credits</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}