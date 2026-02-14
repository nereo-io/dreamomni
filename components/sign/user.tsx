"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { User } from "@/types/user";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

export default function SignUser({ user }: { user: User }) {
  const t = useTranslations();
  const { membership, isLoadingMembership } = useAppContext();
  const [copied, setCopied] = React.useState(false);

  const handleCopyEmail = async () => {
    if (user?.email) {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={user.avatar_url} alt={user.nickname} />
          <AvatarFallback>{user.nickname}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mx-4">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} alt={user.nickname} />
              <AvatarFallback>{user.nickname}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="truncate font-semibold text-sm">
                {user.nickname}
              </span>
              <div className="flex items-center gap-1">
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
                <button
                  onClick={handleCopyEmail}
                  className="inline-flex items-center justify-center rounded-sm p-0.5 hover:bg-accent transition-colors shrink-0"
                  title={copied ? "Copied!" : "Copy email"}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer">
          <Link
            href="/membership"
            className="flex justify-center items-center w-full"
          >
            <span>{t("user.membership")}</span>
            {isLoadingMembership ? (
              <Badge variant="secondary" className="ml-2 animate-pulse">
                Loading...
              </Badge>
            ) : !membership ? (
              <Badge variant="secondary" className="ml-2">
                {t("membership.no_membership")}
              </Badge>
            ) : (
              <Badge
                variant={
                  membership.status === "active" ? "default" : "secondary"
                }
                className="ml-2"
              >
                {membership.status === "active"
                  ? t("membership.status_active")
                  : t("membership.status_expired")}
              </Badge>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer">
          <Link href="/my-orders" className="w-full text-center">
            {t("user.my_orders")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem className="flex justify-center cursor-pointer">
          <Link href="/my-credits">{t("my_credits.title")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* 邀请功能已禁用以防止薅羊毛 */}
        {/* <DropdownMenuItem className="flex justify-center cursor-pointer">
          <Link href="/my-invites">{t("my_invites.title")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator /> */}

        <DropdownMenuItem
          className="flex justify-center cursor-pointer"
          onClick={() => signOut()}
        >
          {t("user.sign_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
