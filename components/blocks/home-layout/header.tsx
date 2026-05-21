"use client"

import { Button } from "@/components/ui/button"
import { useAppContext } from "@/contexts/app"
import LocaleToggle from "@/components/locale/toggle"
import SignToggle from "@/components/sign/toggle"
import Link from "next/link"
import { useLocale } from "next-intl"

export function AIVideoHeader() {
  const { setShowSignModal, user } = useAppContext()
  const locale = useLocale()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between">
        <Link
          href={locale === "en" ? "/" : `/${locale}`}
          className="flex items-center gap-2 text-lg font-semibold text-white transition-opacity hover:opacity-80"
        >
          <img
            src="/logo.png"
            alt="GeminiOmni"
            className="h-8 w-8 rounded-lg object-cover"
            width={32}
            height={32}
          />
          <span>GeminiOmni</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <LocaleToggle />
          {user ? (
            <SignToggle />
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="px-2 text-white hover:bg-gray-800 sm:px-4"
                onClick={() => setShowSignModal(true)}
              >
                Login
              </Button>
              <Button 
                className="hidden bg-primary text-primary-foreground hover:bg-primary/90 sm:inline-flex"
                onClick={() => setShowSignModal(true)}
              >
                Start for Free
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
