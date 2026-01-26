"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavItem, Nav as NavType } from "@/types/blocks/base";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { ChevronRight } from "lucide-react";
import Icon from "@/components/icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { stripLocalePrefix } from "@/utils/pathname";

export default function ({ nav }: { nav: NavType }) {
  const pathname = usePathname() || "";
  const locale = useLocale();
  const activePathname = stripLocalePrefix(pathname, locale);
  const { setOpenMobile } = useSidebar();

  // 处理导航项点击
  const handleNavItemClick = () => {
    // 关闭移动端侧边栏
    setOpenMobile(false);
    console.log("Nav item clicked, closing sidebar");
  };

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Features</SidebarGroupLabel> */}
      <SidebarMenu>
        {nav.items?.map((item: NavItem) => {
          const isActive =
            Boolean(item.is_active) ||
            (item.url ? activePathname.startsWith(item.url) : false);
          const hasActiveChild =
            item.children?.some((subItem: NavItem) => {
              return (
                Boolean(subItem.is_active) ||
                (subItem.url
                  ? activePathname.startsWith(subItem.url)
                  : false)
              );
            }) ?? false;

          return item.children ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.is_expand || hasActiveChild}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <Icon name={item.icon} className="text-xl" />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.children?.map((subItem: NavItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          className={`${
                            Boolean(subItem.is_active) ||
                            (subItem.url
                              ? activePathname.startsWith(subItem.url)
                              : false)
                              ? "text-primary"
                              : ""
                          }`}
                        >
                          <Link
                            href={subItem.url || ""}
                            className="flex items-center gap-1"
                            onClick={handleNavItemClick}
                          >
                            {subItem.icon && (
                              <Icon name={subItem.icon} className="text-xl" />
                            )}
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={`${isActive ? "text-primary" : ""}`}
              >
                <Link
                  href={item.url || ""}
                  className="flex items-center gap-1"
                  onClick={handleNavItemClick}
                >
                  {item.icon && <Icon name={item.icon} className="text-xl" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
