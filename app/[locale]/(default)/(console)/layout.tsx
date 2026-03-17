import ConsoleLayout from "@/components/console/layout";
import { Metadata } from "next";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getTranslations } from "next-intl/server";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ({ children }: { children: ReactNode }) {
  const userInfo = await getUserInfo();
  if (!userInfo || !userInfo.email) {
    redirect("/auth/signin");
  }

  const t = await getTranslations();

  // 获取当前路径
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";

  const sidebar: Sidebar = {
    nav: {
      items: [
        {
          title: t("user.membership"),
          url: "/membership",
          icon: "RiVipCrownLine",
          is_active: pathname.includes("/membership"),
        },
        {
          title: t("user.my_orders"),
          url: "/my-orders",
          icon: "RiOrderPlayLine",
          is_active: false,
        },
        {
          title: t("my_credits.title"),
          url: "/my-credits",
          icon: "RiBankCardLine",
          is_active: false,
        },
        // 邀请功能已禁用以防止薅羊毛
        // {
        //   title: t("my_invites.title"),
        //   url: "/my-invites",
        //   icon: "RiMoneyCnyCircleFill",
        //   is_active: false,
        // },
      ],
    },
  };

  return <ConsoleLayout sidebar={sidebar}>{children}</ConsoleLayout>;
}
