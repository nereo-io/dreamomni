import { SectionHeader } from "@/components/blocks/section-header"
import { EffectGrid } from "@/components/blocks/effect-grid"
import { useTranslations } from "next-intl"

interface Effect {
  id: string
  title: string
  image: string
  isHot?: boolean
}

interface CategoryEffectSectionProps {
  categoryName: string
  effects: Effect[]
  className?: string
}

export function CategoryEffectSection({ 
  categoryName, 
  effects, 
  className = "" 
}: CategoryEffectSectionProps) {
  const t = useTranslations('components.categoryEffectSection')
  return (
    <div className={`mt-16 ${className}`}>
      <SectionHeader
        title={categoryName}
        description={t('defaultDescription', { categoryName: categoryName.toLowerCase() })}
      />
      <EffectGrid effects={effects} />
    </div>
  )
}