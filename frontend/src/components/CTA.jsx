import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

export function CTA() {
    return (
        <section className="relative overflow-hidden border-y bg-gradient-to-br from-primary via-primary/90 to-secondary py-20 text-primary-foreground md:py-32">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
                        Ready to Transform Your Research?
                    </h2>
                    <p className="mt-6 text-lg opacity-90">
                        Join thousands of researchers already using ScholarSyn to accelerate their work.
                        Start free, no credit card required.
                    </p>
                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Link to="/register">
                            <Button
                                size="lg"
                                variant="secondary"
                                className="group gap-2 text-base"
                            >
                                Get Started Free
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                        <Link to="/summarizer">
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-primary-foreground/20 bg-transparent text-base text-primary-foreground hover:bg-primary-foreground/10"
                            >
                                Try Demo
                            </Button>
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 opacity-80">
                        <div className="text-sm">✓ No credit card required</div>
                        <div className="text-sm">✓ Free forever plan</div>
                        <div className="text-sm">✓ Cancel anytime</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
