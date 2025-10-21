import { RainbowButton } from "@/components/ui/rainbow-button";
import Icon from "@/components/icon";
import Link from "next/link";
import { Section as SectionType } from "@/types/blocks/section";

export default function CTA({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="relative w-full overflow-hidden">
      <div className='relative flex min-h-[400px] items-center justify-center bg-[url("/imgs/cta-bg.png")] bg-cover bg-center bg-no-repeat py-20 text-center'>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative z-10 mx-auto max-w-4xl px-8">
          <h2 className="mb-10 text-balance text-3xl font-bold text-white md:text-5xl lg:text-6xl">
            {section.title}
          </h2>
          {section.buttons && (
            <div className="flex flex-col justify-center gap-6 sm:flex-row">
              {section.buttons.map((item, idx) => (
                <Link key={idx} href={item.url || ""} target={item.target} className="inline-block">
                  <RainbowButton>
                    {item.icon && (
                      <Icon name={item.icon as string} className="mr-2 size-5" />
                    )}
                    {item.title}
                  </RainbowButton>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
