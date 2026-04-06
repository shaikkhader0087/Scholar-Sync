import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword } from "@/lib/firebase"

export function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

    const syncWithBackend = async (firebaseUser) => {
        // Sync Firebase user with Django backend
        try {
            const idToken = await firebaseUser.getIdToken()
            const response = await fetch(`${apiUrl}/api/auth/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: firebaseUser.email,
                    password: password || firebaseUser.uid, // Use UID as password for Google auth
                    firebase_uid: firebaseUser.uid,
                    firebase_token: idToken
                })
            })
            const data = await response.json()
            if (response.ok) {
                localStorage.setItem("token", data.token)
                localStorage.setItem("user", JSON.stringify(data.user))
            }
        } catch (err) {
            console.log("Backend sync skipped:", err.message)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            // Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            await syncWithBackend(userCredential.user)

            localStorage.setItem("firebaseUser", JSON.stringify({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName
            }))

            // Also try Django backend login
            try {
                const response = await fetch(`${apiUrl}/api/auth/login/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                })
                const data = await response.json()
                if (response.ok) {
                    localStorage.setItem("token", data.token)
                    localStorage.setItem("user", JSON.stringify(data.user))
                }
            } catch (backendErr) {
                console.log("Django backend auth skipped:", backendErr.message)
            }

            navigate("/summarizer")
        } catch (err) {
            // If Firebase fails, try Django backend only
            try {
                const response = await fetch(`${apiUrl}/api/auth/login/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                })
                const data = await response.json()
                if (response.ok) {
                    localStorage.setItem("token", data.token)
                    localStorage.setItem("user", JSON.stringify(data.user))
                    navigate("/summarizer")
                    return
                }
            } catch (backendErr) {
                // Both failed
            }

            const errorMessages = {
                "auth/user-not-found": "No account found with this email",
                "auth/wrong-password": "Incorrect password",
                "auth/invalid-email": "Invalid email address",
                "auth/invalid-credential": "Invalid email or password",
                "auth/too-many-requests": "Too many attempts. Try again later",
                "auth/configuration-not-found": "Email/Password sign-in is not enabled. Please use Google Sign-In or contact support.",
                "auth/network-request-failed": "Network error. Check your internet connection.",
                "auth/email-already-in-use": "That email is already registered.",
                "auth/weak-password": "Password must be at least 6 characters.",
            }
            setError(errorMessages[err.code] || err.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError("")
        try {
            const result = await signInWithPopup(auth, googleProvider)
            const user = result.user

            localStorage.setItem("firebaseUser", JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }))

            // Try to sync with Django backend
            try {
                const response = await fetch(`${apiUrl}/api/auth/register/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: user.displayName || user.email.split("@")[0],
                        email: user.email,
                        password: user.uid // Use Firebase UID as password
                    })
                })
                const data = await response.json()
                if (response.ok) {
                    localStorage.setItem("token", data.token)
                    localStorage.setItem("user", JSON.stringify(data.user))
                } else {
                    // User might already exist, try login
                    const loginResponse = await fetch(`${apiUrl}/api/auth/login/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: user.email, password: user.uid })
                    })
                    const loginData = await loginResponse.json()
                    if (loginResponse.ok) {
                        localStorage.setItem("token", loginData.token)
                        localStorage.setItem("user", JSON.stringify(loginData.user))
                    }
                }
            } catch (backendErr) {
                console.log("Backend sync skipped:", backendErr.message)
            }

            navigate("/summarizer")
        } catch (err) {
            if (err.code !== "auth/popup-closed-by-user") {
                const googleErrMessages = {
                    "auth/configuration-not-found": "Google Sign-In is not enabled. Please contact support.",
                    "auth/popup-blocked": "Popup was blocked by the browser. Please allow popups and try again.",
                    "auth/network-request-failed": "Network error. Check your internet connection.",
                    "auth/unauthorized-domain": "This domain is not authorized for Google Sign-In.",
                }
                setError(googleErrMessages[err.code] || err.message || "Google sign-in failed")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-1 w-full min-h-screen py-10 items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        Sign in with your email or Google account
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full py-5 font-medium"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">or</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-primary hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
