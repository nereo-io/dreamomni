import { ReactNode } from "react"
import { useTranslations } from "next-intl"

interface Step {
  icon: ReactNode
  title: string
  description: string
}

interface HowToUseSectionProps {
  title?: string
  steps: Step[]
  className?: string
}

export function HowToUseSection({ 
  title, 
  steps, 
  className = "" 
}: HowToUseSectionProps) {
  const t = useTranslations('components.howToUseSection')
  return (
    <div className={`mt-16 bg-gray-900 rounded-lg p-8 ${className}`}>
      <h2 className="text-2xl font-bold text-white mb-6">{title || t('defaultTitle')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <div key={index} className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {step.icon}
            </div>
            <h3 className="text-white font-semibold mb-2">{step.title}</h3>
            <p className="text-gray-400 text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}