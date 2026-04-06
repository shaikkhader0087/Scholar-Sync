import { Header } from "@/components/Header"

export function Layout({ children }) {
    return (
        <div className="relative flex min-h-screen flex-col w-full overflow-x-hidden">
            <Header />
            <main className="flex-1 flex flex-col w-full">{children}</main>
        </div>
    )
}
