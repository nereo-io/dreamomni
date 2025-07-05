import { useTranslations } from "next-intl"

interface SectionHeaderProps {
  title?: string
  description?: string
  className?: string
}

export function SectionHeader({ title, description, className = "" }: SectionHeaderProps) {
  const t = useTranslations('components.sectionHeader')
  
  return (
    <div className={`text-center mb-12 ${className}`}>
      <h2 className="text-3xl font-bold text-white mb-4">{title || t('defaultTitle')}</h2>
      <p className="text-gray-400 max-w-2xl mx-auto">{description || t('defaultDescription')}</p>
    </div>
  )
}