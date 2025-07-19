import { useTranslations } from "next-intl"

export default function HomePage() {
  const t = useTranslations('pages.home')
  
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-white mb-4">
        {t('title')}
      </h1>
      <p className="text-gray-400 max-w-2xl mx-auto">
        {t('description')}
      </p>
    </div>
  )
}