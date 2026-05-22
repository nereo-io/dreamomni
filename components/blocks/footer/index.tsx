import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="py-16 bg-gray-950">
      <div className="max-w-7xl mx-auto px-8">
        <footer>
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-xs shrink flex-col items-center justify-between gap-4 lg:items-start">
              {footer.brand && (
                <div>
                  <div className="flex items-center justify-center gap-2 lg:justify-start">
                    {footer.brand.logo?.src && (
                      <img
                        src={footer.brand.logo.src}
                        alt={footer.brand.logo.alt || footer.brand.title}
                        className="h-11 w-11 object-contain"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        width={44}
                        height={44}
                      />
                    )}
                    {footer.brand.title && (
                      <p className="text-3xl font-semibold">
                        {footer.brand.title}
                      </p>
                    )}
                  </div>
                  {footer.brand.description && (
                    <p className="mt-4 text-md text-muted-foreground">
                      {footer.brand.description}
                    </p>
                  )}
                </div>
              )}
              {footer.social && (
                <ul className="flex items-center space-x-4 text-muted-foreground">
                  {footer.social.items?.map((item, i) => (
                    <li key={i} className="font-medium hover:text-primary">
                      <a href={item.url} target={item.target}>
                        {item.icon && (
                          <Icon name={item.icon} className="size-4" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div
              className={cn(
                "grid gap-6 lg:gap-8",
                "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
              )}
            >
              {footer.nav?.items?.map((item, i) => (
                <div key={i}>
                  <p className="mb-4 font-bold text-base">{item.title}</p>
                  <ul className="space-y-3 text-base text-muted-foreground">
                    {item.children?.map((iitem, ii) => (
                      <li key={ii} className="font-medium hover:text-primary">
                        <a href={iitem.url} target={iitem.target}>
                          {iitem.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {footer.contact && (
                <div className="text-center lg:text-left">
                  <p className="mb-4 font-bold text-base">
                    {footer.contact.title || "CONTACT"}
                  </p>
                  <ul className="space-y-3 text-base text-muted-foreground">
                    {footer.contact.items?.map((item, i) => (
                      <li key={i} className="font-medium hover:text-primary">
                        {item.url ? (
                          <a
                            href={item.url}
                            target={item.target}
                            className="flex items-start gap-2 justify-center lg:justify-start"
                          >
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-5 flex-shrink-0 mt-0.5"
                              />
                            )}
                            <span className="min-w-0 break-all">
                              {item.value || item.title}
                            </span>
                          </a>
                        ) : (
                          <div className="flex items-start gap-2 justify-center lg:justify-start">
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-5 flex-shrink-0 mt-0.5"
                              />
                            )}
                            <span className="min-w-0 break-all">
                              {item.value || item.title}
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-4 border-t pt-8 text-center text-base font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            {footer.copyright && <p>{footer.copyright}</p>}
            {footer.agreement && (
              <ul className="flex justify-center gap-4 lg:justify-start">
                {footer.agreement.items?.map((item, i) => (
                  <li key={i} className="hover:text-primary">
                    <a href={item.url} target={item.target}>
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </footer>
      </div>
    </section>
  );
}
