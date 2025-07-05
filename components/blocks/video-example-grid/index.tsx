import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useTranslations } from "next-intl"

interface VideoExample {
  title: string
  description: string
  image: string
}

interface VideoExampleGridProps {
  examples: VideoExample[]
  className?: string
}

export function VideoExampleGrid({ examples, className = "" }: VideoExampleGridProps) {
  const t = useTranslations('components.videoExampleGrid')
  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {examples.map((item, index) => (
          <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="aspect-video relative">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2"
                >
                  <Play className="h-4 w-4" />
                  <span className="sr-only">{t('playButton')}</span>
                </Button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}