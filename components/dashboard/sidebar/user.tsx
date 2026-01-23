"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  Copy,
  CreditCard,
  Link,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { signOut } from "next-auth/react";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function () {
  const t = useTranslations();

  const { user, setShowSignModal } = useAppContext();
  const { isMobile, open } = useSidebar();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    if (user?.email) {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {user ? (
        <SidebarMenu className="gap-4">
          {!open && (
            <SidebarMenuItem>
              <SidebarMenuButton className="cursor-pointer" asChild>
                <SidebarTrigger />
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar_url} alt={user?.nickname} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.nickname}
                    </span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user?.avatar_url}
                        alt={user?.nickname}
                      />
                      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.nickname}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="truncate text-xs text-muted-foreground">
                          {user?.email}
                        </span>
                        <button
                          onClick={handleCopyEmail}
                          className="inline-flex items-center justify-center rounded-sm p-0.5 hover:bg-accent transition-colors"
                          title={copied ? "Copied!" : "Copy email"}
                        >
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => signOut()}
                >
                  <LogOut />
                  {t("user.sign_out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : (
        <>
          {open ? (
            <div className="flex justify-center items-center h-full px-4 py-4">
              <Button className="w-full" onClick={() => setShowSignModal(true)}>
                {t("user.sign_in")}
              </Button>
            </div>
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="cursor-pointer" asChild>
                  <SidebarTrigger />
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* <SidebarMenuItem>
                <SidebarMenuButton
                  className="cursor-pointer"
                    onClick={() => setShowSignModal(true)}
                  asChild
                >
                  <User />
                </SidebarMenuButton>
              </SidebarMenuItem> */}
            </SidebarMenu>
          )}
        </>
      )}
    </>
  );
}
