import { Header } from "@/components/Header"

export function Layout({ children }) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">{children}</div>
        </div>
    )
}
