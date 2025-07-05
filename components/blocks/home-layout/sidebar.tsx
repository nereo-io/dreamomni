"use client";

import { useState } from "react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      {/* Branding */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-purple-600">
              <span className="text-sm font-bold text-white">V</span>
            </div>
            {!isCollapsed && <span className="text-xl font-bold">Veo3.ai</span>}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex text-white hover:bg-gray-800"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
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
        </div>
      </div>

      {/* Scrollable navigation */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Main */}
        <nav>
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-800 ${
                pathname === item.href ? "bg-gray-800" : ""
              }`}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Video AI items without header */}
        <div>
          {videoAIItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-800 ${
                pathname === item.href ? "bg-gray-800" : ""
              }`}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* Other */}
        <div>
          {otherItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-800 ${
                pathname === item.href ? "bg-gray-800" : ""
              }`}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer actions - only Upgrade Now button */}
      <div className="border-t border-gray-800 p-4">
        <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
          <Crown className="mr-2 h-4 w-4" />
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
        className="fixed left-4 top-4 z-50 bg-gray-900 text-white md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Desktop sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 hidden h-screen transition-all duration-300 md:block ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
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
    </>
  );
}
