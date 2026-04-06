import { useState, useEffect } from "react"
import { Users, FileText, Activity, ShieldCheck, ArrowRight, BarChart3, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AdminDashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem("token")
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
                const response = await fetch(`${apiUrl}/api/auth/stats/`, {
                    headers: { "Authorization": `Token ${token}` }
                })
                const result = await response.json()
                if (response.ok) {
                    setData(result)
                } else {
                    setError(result.detail || "Only admins can access this page.")
                }
            } catch (err) {
                setError("Failed to connect to the server.")
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <div className="flex flex-1 w-full py-20 items-center justify-center">Loading dashboard...</div>
    if (error) return (
        <div className="flex flex-1 w-full py-20 flex-col items-center justify-center gap-4">
            <ShieldCheck className="h-16 w-16 text-destructive" />
            <h1 className="text-2xl font-bold">{error}</h1>
            <Button onClick={() => window.location.href = "/"}>Back to Home</Button>
        </div>
    )

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground">General site statistics and recent activity</p>
                </div>
                <div className="text-sm font-medium bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
                    System Active: {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{data.stats.total_users}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-primary italic font-bold uppercase underline tracking-tight">+0 from yesterday</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Research Papers</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{data.stats.total_papers}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-primary italic font-bold uppercase underline tracking-tight">Total uploaded content</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{data.stats.total_analyses}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-primary italic font-bold uppercase underline tracking-tight">Successful generatioins</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Recent Users
                        </CardTitle>
                        <CardDescription>Latest registrations on the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.recent_activity.users.map((user, i) => (
                                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary">
                                            {user.first_name?.[0] || user.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{user.first_name || user.username}</div>
                                            <div className="text-xs text-muted-foreground">{user.username}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                        {new Date(user.date_joined).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <BarChart3 className="h-5 w-5" />
                            Latest Research Activity
                        </CardTitle>
                        <CardDescription>Recently analyzed documents</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.recent_activity.papers.map((paper, i) => (
                                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 group hover:bg-muted/30 transition-colors p-2 rounded-lg">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="font-semibold truncate">{paper.title}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            by <span className="text-primary italic font-bold uppercase underline tracking-tight">{paper.user__username}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground text-right shrink-0">
                                        <div>{new Date(paper.created_at).toLocaleDateString()}</div>
                                        <div className="text-[10px] opacity-70 italic font-bold uppercase tracking-tight">{new Date(paper.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
