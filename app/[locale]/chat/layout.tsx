import DashboardLayout from "@/components/dashboard/layout";
import Empty from "@/components/blocks/empty";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";
import ChatSessionLibraryWrapper from "@/components/readers/ChatSessionLibraryWrapper";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userInfo = await getUserInfo();
  // console.log("userInfo", userInfo);

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
      url: "/",
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
    library: <ChatSessionLibraryWrapper userId={userInfo.id.toString()} />,
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
          url: "https://x.com/bazi_ai",
          target: "_blank",
          icon: "RiTwitterLine",
        },
        {
          title: "taaf",
          url: "https://theresanaiforthat.com/ai/baziai",
          target: "_blank",
          icon: "RiBook2Line",
        },
      ],
    },
  };

  return <DashboardLayout sidebar={sidebar}>{children}</DashboardLayout>;
}
