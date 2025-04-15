"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

import Icon from "@/components/icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Button as ButtonType } from "@/types/blocks/base";

export default function ({ buttons }: { buttons: ButtonType[] }) {
  const { open } = useSidebar();

  return (
    <>
      {open ? (
        <div className="px-4 mt-2 flex flex-col gap-3">
          {buttons?.map((item, i) => {
            return (
              <Button key={i} variant={item.variant}>
                <Link
                  href={item.url || ""}
                  target={item.target || ""}
                  className="flex items-center gap-1"
                >
                  {item.title}
                  {item.icon && (
                    <Icon name={item.icon} className="size-4 shrink-0" />
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
