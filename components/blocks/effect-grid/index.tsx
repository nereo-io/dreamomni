import { EffectCard } from "@/components/blocks/effect-card"

interface Effect {
  id: string
  title: string
  titleKey?: string
  image: string
  video?: string
  poster?: string
  isHot?: boolean
}

interface EffectGridProps {
  effects: Effect[]
  className?: string
}

export function EffectGrid({ effects, className = "" }: EffectGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {effects.map((effect) => (
        <EffectCard
          key={effect.id}
          id={effect.id}
          title={effect.title}
          titleKey={effect.titleKey}
          image={effect.image}
          video={effect.video}
          poster={effect.poster}
          isHot={effect.isHot}
        />
      ))}
    </div>
  )
}