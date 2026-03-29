import { Brain, Network, MessageSquare, Zap, Shield, FileSearch } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
    {
        icon: Brain,
        title: "AI-Powered Summaries",
        description: "Get instant summaries, study guides, and Q&A from your research papers using advanced AI."
    },
    {
        icon: Network,
        title: "Knowledge Graphs",
        description: "Visualize connections between papers, authors, and concepts in an interactive graph."
    },
    {
        icon: MessageSquare,
        title: "Ask Questions",
        description: "Chat with your research library. Ask questions and get instant, cited answers."
    },
    {
        icon: FileSearch,
        title: "Smart Search",
        description: "Find relevant papers and passages with semantic search powered by vector embeddings."
    },
    {
        icon: Zap,
        title: "Lightning Fast",
        description: "Process hundreds of papers in seconds. No waiting, no delays."
    },
    {
        icon: Shield,
        title: "Secure & Private",
        description: "Your research stays yours. End-to-end encryption and private cloud storage."
    }
]

export function Features() {
    return (
        <section className="border-t bg-muted/50 py-20 md:py-32">
            <div className="container">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
                        Everything You Need for Research
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Powerful tools designed to accelerate your research workflow
                    </p>
                </div>

                <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className="group relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            <CardHeader>
                                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-xl">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
