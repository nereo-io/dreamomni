import { Zap, Shield, Globe, Sparkles } from "lucide-react"

interface FeatureIconsProps {
  title: string
  description: string
}

export function FeatureIcons({ title, description }: FeatureIconsProps) {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate videos in seconds with our optimized AI models"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security"
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Available worldwide with multi-language support"
    },
    {
      icon: Sparkles,
      title: "AI-Powered",
      description: "Advanced AI technology for stunning video generation"
    }
  ]

  return (
    <div className="px-6 py-16 bg-gray-950">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">{description}</p>
      </div>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-lg mb-4">
              <feature.icon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}