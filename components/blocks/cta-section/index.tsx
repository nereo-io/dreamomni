import { Button } from "@/components/ui/button"

interface CTASectionProps {
  title: string
  buttonText: string
  description?: string
}

export function CTASection({ title, buttonText, description }: CTASectionProps) {
  return (
    <div className="px-6 py-16 bg-gradient-to-r from-purple-900 to-pink-900">
      <div className="text-center max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
        {description && (
          <p className="text-gray-200 mb-8 max-w-2xl mx-auto">{description}</p>
        )}
        <Button className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-semibold">
          {buttonText}
        </Button>
      </div>
    </div>
  )
}