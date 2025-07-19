import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

interface HeroSectionProps {
  title: string
  description: string
  buttonText: string
  image: string
  imageAlt: string
  onButtonClick?: () => void
  showNavigation?: boolean
}

export function HeroSection({
  title,
  description,
  buttonText,
  image,
  imageAlt,
  onButtonClick,
  showNavigation = true
}: HeroSectionProps) {
  const t = useTranslations('components.heroSection')
  return (
    <div className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/80 to-primary/60">
      <div className="flex items-center">
        {showNavigation && (
          <Button variant="ghost" size="sm" className="absolute left-4 z-10 text-white hover:bg-white/20">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        <div className="flex-1 flex items-center p-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
            <p className="text-gray-200 mb-6 max-w-md">{description}</p>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full"
              onClick={onButtonClick}
            >
              {buttonText}
            </Button>
          </div>

          <div className="flex-shrink-0">
            <img
              src={image}
              alt={imageAlt}
              className="w-80 h-60 object-cover rounded-lg"
            />
          </div>
        </div>

        {showNavigation && (
          <Button variant="ghost" size="sm" className="absolute right-4 z-10 text-white hover:bg-white/20">
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  )
}