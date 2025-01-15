"use client";

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

import { Brand as BrandType } from "@/types/blocks/base";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

export default function ({ brand }: { brand: BrandType }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <div className="flex items-center gap-1 py-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
              <img
                src={brand?.logo?.src}
                alt={brand?.logo?.alt || brand?.title}
                className="size-6"
              />
            </div>
            <div className="grid flex-1 text-left text-lg leading-tight">
              <span className="truncate font-medium">{brand?.title}</span>
            </div>
            {/* {open && <SidebarTrigger />} */}
          </div>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
