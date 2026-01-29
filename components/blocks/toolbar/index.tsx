import { cn } from '@/lib/utils'
import { Button } from "@/components/ui/button";
import { Button as ButtonType } from "@/types/blocks/base";
import Icon from "@/components/icon";
import Link from "next/link";

export default function Toolbar({ items, className }: { items?: ButtonType[], className?: string }) {
  return (
    <div className={cn("flex space-x-4 mb-8", className)}>
      {items?.map((item, idx) => (
        <Button
          key={idx}
          variant={item.variant}
          size="sm"
          className={item.className}
        >
          <Link
            href={item.url || ""}
            target={item.target}
            className="flex items-center gap-1"
          >
            {item.title}
            {item.icon && <Icon name={item.icon} />}
          </Link>
        </Button>
      ))}
    </div>
  );
}
