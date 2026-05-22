import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ShieldCheck, LogOut, User } from "lucide-react"

function getAuthState() {
    const userStr = localStorage.getItem("user")
    return {
        token: localStorage.getItem("token"),
        user: userStr ? JSON.parse(userStr) : null
    }
}

export function Header() {
    const navigate = useNavigate()
    const [authState, setAuthState] = useState(getAuthState)

    // Re-read auth from localStorage whenever login/logout happens
    useEffect(() => {
        const refresh = () => setAuthState(getAuthState())
        // Custom event fired by LoginPage & RegisterPage after setting the token
        window.addEventListener("auth-change", refresh)
        // Native event for cross-tab sync
        window.addEventListener("storage", refresh)
        return () => {
            window.removeEventListener("auth-change", refresh)
            window.removeEventListener("storage", refresh)
        }
    }, [])

    const { token, user } = authState

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("firebaseUser")
        setAuthState({ token: null, user: null })
        window.dispatchEvent(new Event("auth-change"))
        navigate("/login")
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center px-4">
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
