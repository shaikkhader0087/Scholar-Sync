import { Link } from "react-router-dom"
import { Github, Twitter, Linkedin } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t bg-muted/50">
            <div className="container py-12 md:py-16">
                <div className="grid gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <h3 className="mb-4 text-lg font-bold">ScholarSyn</h3>
                        <p className="text-sm text-muted-foreground">
                            AI-powered research assistant for scholars and researchers.
                        </p>
                        <div className="mt-4 flex gap-3">
                            <a href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="mb-4 font-semibold">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/summarizer" className="hover:text-foreground">Summarizer</Link></li>
                            <li><a href="#features" className="hover:text-foreground">Features</a></li>
                            <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                            <li><a href="#" className="hover:text-foreground">API</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="mb-4 font-semibold">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground">About</a></li>
                            <li><a href="#" className="hover:text-foreground">Blog</a></li>
                            <li><a href="#" className="hover:text-foreground">Careers</a></li>
                            <li><a href="#" className="hover:text-foreground">Contact</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="mb-4 font-semibold">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                            <li><a href="#" className="hover:text-foreground">Terms</a></li>
                            <li><a href="#" className="hover:text-foreground">Security</a></li>
                            <li><a href="#" className="hover:text-foreground">Cookies</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>© 2026 ScholarSyn. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
