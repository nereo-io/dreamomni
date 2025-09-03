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

export default function SignUser({ user }: { user: User }) {
  const t = useTranslations();
  const { membership, isLoadingMembership } = useAppContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={user.avatar_url} alt={user.nickname} />
          <AvatarFallback>{user.nickname}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mx-4">
        <DropdownMenuLabel className="text-center truncate">
          {user.nickname}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer">
          <Link
            href="/membership"
            className="flex justify-between items-center w-full"
          >
            <span>{t("user.membership")}</span>
            {isLoadingMembership ? (
              <Badge variant="secondary" className="ml-2 animate-pulse">
                加载中...
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
