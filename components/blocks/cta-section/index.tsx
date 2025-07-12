import { Button } from "@/components/ui/button"

interface CTASectionProps {
  title?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
}

export function CTASection({ 
  title, 
  description, 
  buttonText, 
  onButtonClick 
}: CTASectionProps) {
  const finalTitle = title || 'Ready to Create Amazing Videos?'
  const finalDescription = description || 'Join thousands of creators who are already using AI to bring their ideas to life. Start generating professional videos today.'
  const finalButtonText = buttonText || 'Start Creating'

  return (
    <div className="px-6 py-16 bg-gradient-to-r from-primary/80 to-primary/60">
      <div className="text-center max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-4">{finalTitle}</h2>
        {finalDescription && (
          <p className="text-gray-200 mb-8 max-w-2xl mx-auto">{finalDescription}</p>
        )}
        <Button 
          className="bg-background text-primary hover:bg-muted px-8 py-3 rounded-full text-lg font-semibold"
          onClick={onButtonClick}
        >
          {finalButtonText}
        </Button>
      </div>
    </div>
  )
}