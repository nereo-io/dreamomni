import DashboardLayout from "@/components/dashboard/layout";
import Empty from "@/components/blocks/empty";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";
import ChatSessionLibrary from "@/components/readers/ChatSessionLibrary";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userInfo = await getUserInfo();
  console.log("userInfo", userInfo);

  if (!userInfo?.id || !userInfo.email) {
    redirect("/auth/signin");
  }

  const sidebar: Sidebar = {
    brand: {
      title: "BaziAI",
      logo: {
        src: "/logo.svg",
        alt: "BaziAI",
      },
      url: "/admin",
    },
    nav: {
      items: [
        {
          title: "New Chat",
          url: "/chat",
          icon: "RiChatSmile2Line",
        },
      ],
    },
    library: <ChatSessionLibrary userId={userInfo.id.toString()} />,
    social: {
      items: [
        {
          title: "Home",
          url: "/",
          target: "_blank",
          icon: "RiHomeLine",
        },
        {
          title: "X",
          url: "https://x.com/shipanyai",
          target: "_blank",
          icon: "RiTwitterLine",
        },
      ],
    },
  };

  return <DashboardLayout sidebar={sidebar}>{children}</DashboardLayout>;
}
