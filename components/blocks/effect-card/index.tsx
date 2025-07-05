import Link from "next/link"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"

interface EffectCardProps {
  id: string
  titleKey?: string
  title?: string
  image: string
  isHot?: boolean
}

export function EffectCard({ id, titleKey, title, image, isHot }: EffectCardProps) {
  const t = useTranslations('effects')
  const displayTitle = titleKey ? t(titleKey as any) : title
  
  return (
    <Link href={`/video-affects/${id}`} className="group">
      <div className="relative bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
        <div className="aspect-video relative">
          <img
            src={image || "/placeholder.svg"}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isHot && <Badge className="absolute top-2 right-2 bg-red-600 hover:bg-red-600">Hot</Badge>}
        </div>
        <div className="p-4">
          <h3 className="text-white font-medium">{displayTitle}</h3>
        </div>
      </div>
    </Link>
  )
}