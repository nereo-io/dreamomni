"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ImageIcon,
  Type,
  Sparkles,
  FolderOpen,
  Crown,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PricingModal from "@/components/blocks/pricing/pricing-modal";
import { Pricing } from "@/types/blocks/pricing";
import { getPricingBlock } from "@/services/page";
import { useSidebar } from "@/contexts/sidebar";

const sidebarItems = [{ icon: Home, label: "Home", href: "/home" }];

const videoAIItems = [
  { icon: ImageIcon, label: "Image to Video", href: "/image-to-video" },
  { icon: Type, label: "Text to Video", href: "/text-to-video" },
  { icon: Sparkles, label: "AI Video Effects", href: "/video-affects" },
];

const otherItems = [
  { icon: FolderOpen, label: "My Creations", href: "/history" },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingData, setPricingData] = useState<Pricing | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const data = await getPricingBlock("en");
        setPricingData(data);
      } catch (error) {
        console.error("Failed to fetch pricing data:", error);
      }
    };

    fetchPricingData();
  }, []);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      {/* Branding */}
      <div className="border-b border-gray-800 p-4">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "space-x-2"
            }`}
          >
            <img
              src="/logo.png"
              alt="Veo3"
              className="w-8 h-8"
            />
            {!isCollapsed && <span className="text-xl font-bold">Veo3</span>}
          </div>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-white"
                onClick={() => setIsOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable navigation */}
      <div
        className={`flex-1 overflow-y-auto p-4 ${
          isCollapsed ? "space-y-2" : "space-y-6"
        }`}
      >
        {/* Main */}
        <nav className={isCollapsed ? "space-y-2" : "space-y-0"}>
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg transition-colors hover:bg-gray-800 ${
                pathname === item.href ? "bg-gray-800" : ""
              } ${isCollapsed ? "justify-center p-2" : "space-x-3 px-3 py-2"}`}
            >
              <item.icon className={isCollapsed ? "h-6 w-6" : "h-5 w-5"} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Video AI items without header */}
        <div className={isCollapsed ? "space-y-2" : "space-y-0"}>
          {videoAIItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg transition-colors hover:bg-gray-800 ${
                pathname === item.href ? "bg-gray-800" : ""
              } ${isCollapsed ? "justify-center p-2" : "space-x-3 px-3 py-2"}`}
            >
              <item.icon className={isCollapsed ? "h-6 w-6" : "h-5 w-5"} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* Other */}
        <div className={isCollapsed ? "space-y-2" : "space-y-0"}>
          {otherItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg transition-colors hover:bg-gray-800 ${
                pathname === item.href ? "bg-gray-800" : ""
              } ${isCollapsed ? "justify-center p-2" : "space-x-3 px-3 py-2"}`}
            >
              <item.icon className={isCollapsed ? "h-6 w-6" : "h-5 w-5"} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer actions - only Upgrade Now button */}
      <div className="border-t border-gray-800 p-4">
        <Button
          className={`w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 ${
            isCollapsed ? "flex items-center justify-center p-2" : ""
          }`}
          onClick={() => setShowPricingModal(true)}
        >
          <Crown className={`${isCollapsed ? "h-6 w-6" : "mr-2 h-4 w-4"}`} />
          {!isCollapsed && <span>Upgrade Now</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed left-4 top-4 z-[70] bg-gray-900 text-white md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Desktop sidebar */}
      <div
        className={`fixed left-0 top-0 z-[60] hidden h-screen transition-all duration-300 md:block ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarContent />

        {/* Collapse button inside sidebar */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1/2 -translate-y-1/2 right-2 z-10 text-white hover:bg-gray-700 hover:text-white w-8 h-10 p-0 rounded-lg bg-gray-800/50"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-64">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {pricingData && (
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          pricing={pricingData}
        />
      )}
    </>
  );
}
