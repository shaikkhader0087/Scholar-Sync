import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, FileText, Brain, Network, MessageSquare, Zap, BookOpen } from "lucide-react"
import { Link } from "react-router-dom"

const FloatingCard = ({ icon: Icon, title, color, delay, position }) => (
    <div
        className={`absolute ${position} animate-float opacity-0`}
        style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}
    >
        <div className="group rounded-xl border bg-card p-4 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:shadow-xl">
            <div className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">{title}</p>
        </div>
    </div>
)

export function Hero() {
    return (
        <section className="relative min-h-[90vh] overflow-hidden bg-background">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

            <div className="container relative z-10 flex flex-col items-center justify-center gap-12 py-32">
                {/* Top Content */}
                <div className="flex flex-col items-center gap-6 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-medium">AI-Powered Research Assistant</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="max-w-4xl font-bold leading-tight tracking-tighter">
                        <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                            Build consistent{" "}
                        </span>
                        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-4xl text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
                            research systems
                        </span>
                        <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                            at scale
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                        Create, maintain, and scale your research workflow. From design tokens to components,
                        we've got you covered.
                    </p>
                </div>

                {/* Central Floating Cards Container */}
                <div className="relative h-[400px] w-full max-w-3xl">
                    {/* Central Logo/Icon */}
                    <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-2xl">
                            <span className="text-4xl font-bold text-primary-foreground">S</span>
                        </div>
                    </div>

                    {/* Floating Cards */}
                    <FloatingCard
                        icon={FileText}
                        title="PDF Analysis"
                        color="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        delay={0.2}
                        position="left-[10%] top-[20%]"
                    />
                    <FloatingCard
                        icon={Brain}
                        title="AI Summaries"
                        color="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                        delay={0.4}
                        position="right-[15%] top-[15%]"
                    />
                    <FloatingCard
                        icon={Network}
                        title="Knowledge Graph"
                        color="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                        delay={0.6}
                        position="left-[5%] bottom-[25%]"
                    />
                    <FloatingCard
                        icon={MessageSquare}
                        title="Q&A Chat"
                        color="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
                        delay={0.8}
                        position="right-[10%] bottom-[30%]"
                    />
                    <FloatingCard
                        icon={Zap}
                        title="Fast Search"
                        color="bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400"
                        delay={1.0}
                        position="left-[25%] top-[10%]"
                    />
                    <FloatingCard
                        icon={BookOpen}
                        title="Study Guides"
                        color="bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400"
                        delay={1.2}
                        position="right-[20%] bottom-[15%]"
                    />
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-4 sm:flex-row">
                    <Link to="/register">
                        <Button size="lg" className="group gap-2 text-base">
                            Get Started Free
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                    <Link to="/summarizer">
                        <Button size="lg" variant="outline" className="text-base">
                            Watch Demo
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}
