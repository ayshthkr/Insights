"use client"
import { Lightbulb, TrendingUp, BookOpen, Zap, Shield, Globe, Clock, Users, Sparkles, Code, PieChart, Heart, Search, Brain, Rss, Database } from "lucide-react"
import { motion } from "framer-motion"

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

const technologyFeatures = [
	{
		icon: Search,
		title: "Powered by Exa AI",
		description: "Advanced semantic search capabilities for finding the most relevant sources",
		color: "from-blue-500 to-indigo-600",
	},
	{
		icon: Brain,
		title: "Google Gemini 2.5 Flash",
		description: "State-of-the-art language model for comprehensive and accurate responses",
		color: "from-purple-500 to-violet-600",
	},
	{
		icon: Rss,
		title: "Real-time Streaming",
		description: "See responses being generated in real-time with beautiful formatting",
		color: "from-green-500 to-emerald-600",
	},
	{
		icon: Database,
		title: "Source Citations",
		description: "Every answer includes clickable citations to verify information",
		color: "from-orange-500 to-red-600",
	},
]

const additionalFeatures = [
	{
		icon: Shield,
		title: "Privacy First",
		description: "Your queries are processed securely and we don't store personal data",
		color: "from-blue-500 to-indigo-600",
	},
	{
		icon: Globe,
		title: "Real-time Data",
		description: "Access to the latest information from across the web",
		color: "from-green-500 to-emerald-600",
	},
	{
		icon: Clock,
		title: "Instant Results",
		description: "Get comprehensive answers in seconds, not minutes",
		color: "from-purple-500 to-violet-600",
	},
	{
		icon: Users,
		title: "Multi-language",
		description: "Ask questions in multiple languages and get native responses",
		color: "from-orange-500 to-red-600",
	},
]

const useCases = [
	{
		icon: Code,
		title: "For Developers",
		examples: ["Debug code issues", "Learn new frameworks", "Architecture decisions", "Best practices"],
	},
	{
		icon: PieChart,
		title: "For Business",
		examples: ["Market research", "Competitor analysis", "Industry trends", "Strategy insights"],
	},
	{
		icon: BookOpen,
		title: "For Students",
		examples: ["Research papers", "Concept explanations", "Study guides", "Project ideas"],
	},
	{
		icon: Heart,
		title: "For Everyone",
		examples: ["Health information", "Travel planning", "Recipe ideas", "Life advice"],
	},
]

export function WelcomeSection() {
	return (
		<div className="text-center py-16 space-y-20">
			<div className="max-w-4xl mx-auto">
				<div className="mb-12">
					<h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
						Get instant answers to anything
					</h2>
					<p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
						Get instant, comprehensive answers to your questions backed by real-time web research and AI analysis.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
					{features.map((feature, index) => {
						const Icon = feature.icon
						return (
							<motion.div
								key={index}
								className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300"
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
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
							</motion.div>
						)
					})}
				</div>

				<motion.div
					className="mt-12 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.4 }}
					viewport={{ once: true }}
				>
					<div className="flex items-center justify-center gap-2 mb-3">
						<Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
						<h3 className="font-semibold text-emerald-900 dark:text-emerald-100">✨ Powered by Advanced AI</h3>
					</div>
					<p className="text-emerald-700 dark:text-emerald-300 text-sm">
						Our AI combines real-time web search with advanced language models to provide accurate, comprehensive, and
						up-to-date answers to your questions.
					</p>
				</motion.div>
			</div>

			{/* Additional Features Section */}
			<motion.div
				className="max-w-6xl mx-auto"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
				viewport={{ once: true }}
			>
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
						Why choose our AI assistant?
					</h2>
					<p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
						Built with privacy, speed, and accuracy in mind
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{additionalFeatures.map((feature, index) => {
						const Icon = feature.icon
						return (
							<motion.div
								key={index}
								className="text-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-lg transition-all duration-300 group"
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
									<Icon className="w-8 h-8 text-white" />
								</div>
								<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
									{feature.title}
								</h3>
								<p className="text-slate-600 dark:text-slate-400 text-sm">
									{feature.description}
								</p>
							</motion.div>
						)
					})}
				</div>
			</motion.div>

			{/* Technology Stack Section */}
			<motion.div
				className="max-w-6xl mx-auto"
				initial={{ opacity: 0, y: 30 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.2 }}
				viewport={{ once: true }}
			>
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
						Powered by Cutting-Edge AI Technology
					</h2>
					<p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
						Our platform combines the latest advancements in AI and search technology to deliver unparalleled results.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{technologyFeatures.map((feature, index) => {
						const Icon = feature.icon
						return (
							<motion.div
								key={index}
								className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-500"
								initial={{ opacity: 0, y: 20, scale: 0.9 }}
								whileInView={{ opacity: 1, y: 0, scale: 1 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
								whileHover={{ y: -5 }}
							>
								<div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
								<div className="relative z-10">
									<div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
										<Icon className="w-6 h-6 text-white" />
									</div>
									<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
										{feature.title}
									</h3>
									<p className="text-sm text-slate-600 dark:text-slate-400">
										{feature.description}
									</p>
								</div>
							</motion.div>
						)
					})}
				</div>
			</motion.div>

			{/* Use Cases Section */}
			<motion.div
				className="max-w-6xl mx-auto"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.3 }}
				viewport={{ once: true }}
			>
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
						Perfect for every use case
					</h2>
					<p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
						Whether you&apos;re learning, working, or just curious - we&apos;ve got you covered
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{useCases.map((useCase, index) => {
						const Icon = useCase.icon
						return (
							<motion.div
								key={index}
								className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<div className="flex items-center gap-3 mb-4">
									<div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
										<Icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
									</div>
									<h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
										{useCase.title}
									</h3>
								</div>
								<ul className="space-y-2 text-left">
									{useCase.examples.map((example, exampleIndex) => (
										<li key={exampleIndex} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
											<div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
											{example}
										</li>
									))}
								</ul>
							</motion.div>
						)
					})}
				</div>
			</motion.div>

			{/* CTA Section */}
			<motion.div
				className="max-w-4xl mx-auto"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.4 }}
				viewport={{ once: true }}
			>
				<div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 md:p-12 text-white text-center">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Ready to get started?
					</h2>
					<p className="text-xl text-emerald-100 mb-6 max-w-2xl mx-auto">
						Join thousands of users who are already getting smarter, faster answers to their questions.
					</p>
					<motion.button
						className="bg-white text-emerald-600 font-semibold px-8 py-3 rounded-2xl hover:bg-emerald-50 transition-colors"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
					>
						Ask Your First Question
					</motion.button>
				</div>
			</motion.div>
		</div>
	)
}
