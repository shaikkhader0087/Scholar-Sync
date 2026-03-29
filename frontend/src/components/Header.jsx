import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ShieldCheck, LogOut, User } from "lucide-react"

export function Header() {
    const navigate = useNavigate()
    const userStr = localStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    const token = localStorage.getItem("token")

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        navigate("/login")
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4">
                <div className="mr-4 flex">
                    <Link className="mr-6 flex items-center space-x-2" to="/">
                        <span className="font-bold sm:inline-block text-primary">
                            ScholarSyn
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link className="transition-colors hover:text-foreground/80 text-foreground/60" to="/summarizer">
                            Summarizer
                        </Link>
                        {user?.is_staff && (
                            <Link className="transition-colors hover:text-primary text-primary/80 flex items-center gap-1 font-bold" to="/admin-dashboard">
                                <ShieldCheck className="h-4 w-4" />
                                Admin
                            </Link>
                        )}
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <nav className="flex items-center space-x-2">
                        {token ? (
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    {user?.name || user?.email}
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">
                                        Log In
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="sm">
                                        Get Started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    )
}
