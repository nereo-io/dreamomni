"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Header as HeaderType } from "@/types/blocks/header";
import Icon from "@/components/icon";
import InviteButton from "@/components/invite/invite-button";
import Link from "next/link";
import LocaleToggle from "@/components/locale/toggle";
import { Menu } from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import ThemeToggle from "@/components/theme/toggle";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function Header({ header }: { header: HeaderType }) {
  const [addBorder, setAddBorder] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setAddBorder(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (header.disabled) {
    return null;
  }

  return (
    <section className={cn(
      "sticky top-0 z-50 transition-all duration-200 text-white",
      addBorder ? "bg-background/60 backdrop-blur border-b border-border/40" : "bg-transparent"
    )}>
      <div className="md:max-w-7xl mx-auto px-4 py-3">
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            <a
              href={header.brand?.url || ""}
              className="flex items-center gap-2"
            >
              {header.brand?.logo?.src && (
                <img
                  src={header.brand.logo.src}
                  alt={header.brand.logo.alt || header.brand.title}
                  className="w-8"
                />
              )}
              {header.brand?.title && (
                <span className="text-2xl text-white font-bold">
                  {header.brand?.title || ""}
                </span>
              )}
            </a>
          </div>
          <div className="flex items-center">
            <div className="flex items-center mr-8">
              {header.nav?.items?.map((item, i) => {
                if (item.children && item.children.length > 0) {
                  return (
                    <NavigationMenu key={i}>
                      <NavigationMenuList>
                        <NavigationMenuItem
                          className="text-white/90"
                        >
                          <NavigationMenuTrigger 
                            className="text-white/90 hover:text-white font-medium text-lg" 
                            style={{ fontSize: '20px' }}
                          >
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-4 shrink-0 mr-2"
                              />
                            )}
                            <span>{item.title}</span>
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="min-w-[160px] p-1">
                              <NavigationMenuLink>
                                {item.children.map((iitem, ii) => (
                                  <li key={ii}>
                                    <a
                                      className={cn(
                                        "flex items-center select-none gap-2 rounded-sm px-3 py-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                      )}
                                      href={iitem.url}
                                      target={iitem.target}
                                    >
                                      {iitem.icon && (
                                        <Icon
                                          name={iitem.icon}
                                          className="size-4 shrink-0"
                                        />
                                      )}
                                      <span className="text-base font-medium">
                                        {iitem.title}
                                      </span>
                                    </a>
                                  </li>
                                ))}
                              </NavigationMenuLink>
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      </NavigationMenuList>
                    </NavigationMenu>
                  );
                }

                return (
                  <a
                    key={i}
                    className={cn(
                      "text-white/90 hover:text-white font-medium px-4 py-2 rounded-md transition-colors inline-flex items-center",
                      "text-lg !text-lg"
                    )}
                    style={{ fontSize: '20px' }}
                    href={item.url}
                    target={item.target}
                  >
                    {item.icon && (
                      <Icon
                        name={item.icon}
                        className="size-4 shrink-0 mr-2"
                      />
                    )}
                    {item.title}
                  </a>
                );
              })}
            </div>
            <div className="shrink-0 flex gap-3 items-center">
            {header.show_locale && <LocaleToggle />}
            {header.show_theme && <ThemeToggle />}
            <InviteButton />

            {header.buttons?.map((item, i) => {
              const isLastButton = i === (header.buttons?.length || 0) - 1;
              return (
                <Button 
                  key={i} 
                  variant={isLastButton ? "default" : "outline"}
                  className={cn(
                    "transition-all duration-200",
                    isLastButton && "bg-primary hover:bg-primary/90"
                  )}
                >
                  <Link
                    href={item.url || ""}
                    target={item.target || ""}
                    className="flex items-center gap-2"
                  >
                    {item.title}
                    {item.icon && (
                      <Icon name={item.icon} className="size-4 shrink-0" />
                    )}
                  </Link>
                </Button>
              );
            })}
            {header.show_sign && <SignToggle />}
            </div>
          </div>
        </nav>

        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <a
              href={header.brand?.url || ""}
              className="flex items-center gap-2"
            >
              {header.brand?.logo?.src && (
                <img
                  src={header.brand.logo.src}
                  alt={header.brand.logo.alt || header.brand.title}
                  className="w-8"
                />
              )}
              {header.brand?.title && (
                <span className="text-2xl text-white font-bold">
                  {header.brand?.title || ""}
                </span>
              )}
            </a>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      {header.brand?.logo?.src && (
                        <img
                          src={header.brand.logo.src}
                          alt={header.brand.logo.alt || header.brand.title}
                          className="w-8"
                        />
                      )}
                      {header.brand?.title && (
                        <span className="text-2xl font-bold text-foreground">
                          {header.brand?.title || ""}
                        </span>
                      )}
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="mb-8 mt-8 flex flex-col gap-4">
                  <Accordion type="single" collapsible className="w-full">
                    {header.nav?.items?.map((item, i) => {
                      if (item.children && item.children.length > 0) {
                        return (
                          <AccordionItem
                            key={i}
                            value={item.title || ""}
                            className="border-b-0"
                          >
                            <AccordionTrigger className="mb-4 py-0 font-semibold hover:no-underline text-left">
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="mt-2">
                              {item.children.map((iitem, ii) => (
                                <a
                                  key={ii}
                                  className={cn(
                                    "flex items-center select-none gap-2 rounded-md px-3 py-2 leading-none outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  )}
                                  href={iitem.url}
                                  target={iitem.target}
                                >
                                  {iitem.icon && (
                                    <Icon
                                      name={iitem.icon}
                                      className="size-4 shrink-0"
                                    />
                                  )}
                                  <span className="text-base font-medium">
                                    {iitem.title}
                                  </span>
                                </a>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                      return (
                        <a
                          key={i}
                          href={item.url}
                          target={item.target}
                          className="font-semibold my-4 flex items-center gap-2"
                        >
                          {item.title}
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0"
                            />
                          )}
                        </a>
                      );
                    })}
                  </Accordion>
                </div>
                <div className="flex-1"></div>
                <div className="border-t pt-4">
                  <div className="mt-2 flex flex-col gap-3">
                    <InviteButton />
                    
                    {header.buttons?.map((item, i) => {
                      const isLastButton = i === (header.buttons?.length || 0) - 1;
                      return (
                        <Button 
                          key={i} 
                          variant={isLastButton ? "default" : "outline"}
                          className="w-full justify-center"
                        >
                          <Link
                            href={item.url || ""}
                            target={item.target || ""}
                            className="flex items-center gap-2 w-full justify-center"
                          >
                            {item.title}
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-4 shrink-0"
                              />
                            )}
                          </Link>
                        </Button>
                      );
                    })}

                    {header.show_sign && <SignToggle />}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {header.show_locale && <LocaleToggle />}
                    <div className="flex-1"></div>

                    {header.show_theme && <ThemeToggle />}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
}
