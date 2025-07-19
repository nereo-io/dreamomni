import { useTranslations } from "next-intl"

interface CategoryTabsProps {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
  className?: string
}

export function CategoryTabs({ 
  categories, 
  activeCategory, 
  onCategoryChange, 
  className = "" 
}: CategoryTabsProps) {
  const t = useTranslations('components.categoryTabs')
  
  const getTranslatedCategory = (category: string) => {
    const key = category.toLowerCase().replace(/[^a-z0-9]/g, '')
    // Map special cases
    const keyMap: Record<string, string> = {
      'herosallanh': 'heroVillain',
      'horrorfantasy': 'horrorFantasy'
    }
    const translationKey = keyMap[key] || key
    return t(translationKey as any) || category
  }
  return (
    <div className={`flex flex-wrap gap-2 mb-8 border-b border-gray-800 ${className}`}>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeCategory === category
              ? "text-white border-b-2 border-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {getTranslatedCategory(category)}
          {category === "Others" && (
            <span className="ml-2 bg-destructive text-xs px-2 py-1 rounded-full">{t('newLabel')}</span>
          )}
        </button>
      ))}
    </div>
  )
}