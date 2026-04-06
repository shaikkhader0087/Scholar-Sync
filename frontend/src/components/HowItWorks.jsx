import { Upload, Sparkles, MessageSquare, Download } from "lucide-react"

const steps = [
    {
        icon: Upload,
        title: "Upload Your Papers",
        description: "Drag and drop PDFs, DOCX files, or paste text directly. We support all major formats."
    },
    {
        icon: Sparkles,
        title: "AI Processes Everything",
        description: "Our AI extracts key concepts, builds knowledge graphs, and creates vector embeddings."
    },
    {
        icon: MessageSquare,
        title: "Ask & Explore",
        description: "Chat with your research, generate summaries, or explore the knowledge graph visually."
    },
    {
        icon: Download,
        title: "Export & Share",
        description: "Download insights, share graphs, or export to your favorite note-taking apps."
    }
]

export function HowItWorks() {
    return (
        <section className="py-20 md:py-32">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
                        How It Works
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        From upload to insights in four simple steps
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-4xl">
                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute left-8 top-0 h-full w-0.5 bg-gradient-to-b from-primary via-secondary to-accent md:left-1/2" />

                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`relative mb-12 flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                                    } flex-col md:gap-16`}
                            >
                                {/* Content */}
                                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'} text-left`}>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-3">
                                        Step {index + 1}
                                    </div>
                                    <h3 className="text-2xl font-bold">{step.title}</h3>
                                    <p className="mt-2 text-muted-foreground">{step.description}</p>
                                </div>

                                {/* Icon Circle */}
                                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-primary to-secondary shadow-lg">
                                    <step.icon className="h-8 w-8 text-primary-foreground" />
                                </div>

                                {/* Spacer for md+ */}
                                <div className="hidden flex-1 md:block" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
