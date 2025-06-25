"use client"
import { Lightbulb, TrendingUp, BookOpen, Zap } from "lucide-react"

const features = [
  {
    icon: Lightbulb,
    title: "Ask about current events",
    description: "Get the latest information on news, technology, and world events",
    example: "What are the latest developments in AI technology?",
  },
  {
    icon: BookOpen,
    title: "Research complex topics",
    description: "Deep dive into academic subjects and complex concepts",
    example: "Explain quantum computing and its practical applications",
  },
  {
    icon: TrendingUp,
    title: "Market insights",
    description: "Stay updated with financial markets and business trends",
    example: "What are the current trends in cryptocurrency markets?",
  },
  {
    icon: Zap,
    title: "Learn new skills",
    description: "Get guidance on learning new technologies and skills",
    example: "How do I get started with machine learning?",
  },
]

export function WelcomeSection() {
  return (
    <div className="text-center py-16 animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Welcome to your AI-powered search assistant
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Get instant, comprehensive answers to your questions backed by real-time web research and AI analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                    <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-3 text-sm">{feature.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 italic">&ldquo;{feature.example}&rdquo;</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">✨ Powered by Advanced AI</h3>
          <p className="text-emerald-700 dark:text-emerald-300 text-sm">
            Our AI combines real-time web search with advanced language models to provide accurate, comprehensive, and
            up-to-date answers to your questions.
          </p>
        </div>
      </div>
    </div>
  )
}
