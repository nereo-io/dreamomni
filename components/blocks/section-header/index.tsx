import { RainbowButton } from "@/components/ui/rainbow-button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface SectionHeaderProps {
  title?: string;
  description?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonHref?: string;
  centerAlign?: boolean;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  showButton = false,
  buttonText,
  buttonHref = "/image-to-video",
  centerAlign = true,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`${centerAlign ? "text-center" : ""} ${className}`}>
      {title && (
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
          {title}
        </h2>
      )}

      {description && (
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          {description}
        </p>
      )}

      {showButton && buttonText && (
        <div className="mt-8 flex justify-center">
          <Link href={buttonHref} className="inline-block">
            <RainbowButton>
              <Sparkles className="mr-2 w-5 h-5" />
              {buttonText}
            </RainbowButton>
          </Link>
        </div>
      )}
    </div>
  );
}
