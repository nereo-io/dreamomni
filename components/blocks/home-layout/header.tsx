"use client"

import { Button } from "@/components/ui/button"
import { useAppContext } from "@/contexts/app"
import LocaleToggle from "@/components/locale/toggle"
import SignToggle from "@/components/sign/toggle"

export function AIVideoHeader() {
  const { setShowSignModal, user } = useAppContext()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-white font-semibold text-lg">Veo3.ai</span>
        </div>
        <div className="flex items-center space-x-4">
          <LocaleToggle />
          {user ? (
            <SignToggle />
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-gray-800"
                onClick={() => setShowSignModal(true)}
              >
                Login
              </Button>
              <Button 
                className="bg-white text-gray-900 hover:bg-gray-100"
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