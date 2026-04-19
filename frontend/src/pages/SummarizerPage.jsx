import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useDropzone } from "react-dropzone"
import {
    FileText, Upload, X, Sparkles, MessageSquare, BookOpen,
    HelpCircle, List, Cpu, History, Send, Loader2, Bot, User, BarChart3,
    Trash2, Download, FlipVertical, BookMarked, Search, Table2, Settings2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const AI_MODELS = [
    { value: "deepseek-chat", label: "DeepSeek Chat", provider: "DeepSeek", icon: "🔮" },
    { value: "deepseek-reasoner", label: "DeepSeek Reasoner", provider: "DeepSeek", icon: "🧪" },
    { value: "gpt-4", label: "GPT-4", provider: "OpenAI", icon: "🤖" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "OpenAI", icon: "⚡" },
    { value: "claude-3-opus", label: "Claude 3 Opus", provider: "Anthropic", icon: "🧠" },
    { value: "claude-3-sonnet", label: "Claude 3 Sonnet", provider: "Anthropic", icon: "🎵" },
    { value: "gemini-pro", label: "Gemini Pro", provider: "Google", icon: "💎" },
    { value: "llama-3", label: "Llama 3", provider: "Meta", icon: "🦙" },
]

const TABS = [
    { key: "summary", label: "Summary", icon: FileText },
    { key: "studyGuide", label: "Study Guide", icon: BookOpen },
    { key: "faq", label: "FAQ", icon: HelpCircle },
    { key: "keyTopics", label: "Key Topics", icon: List },
    { key: "flashcards", label: "Flashcards", icon: FlipVertical },
    { key: "tables", label: "Tables", icon: Table2 },
    { key: "analytics", label: "Visual Insights", icon: BarChart3 },
    { key: "litReview", label: "Lit Review", icon: BookMarked },
    { key: "researchGaps", label: "Research Gaps", icon: Search },
    { key: "chat", label: "Q&A Chat", icon: MessageSquare },
]

const CHART_COLORS = [
    "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
    "#818cf8", "#7c3aed", "#5b21b6", "#4f46e5",
    "#6d28d9", "#9333ea"
]

/* ── Helpers for extracting chart data from analysis text ────────── */

function extractSections(text) {
    if (!text) return []
    const headingRegex = /^#{1,3}\s+(.+)$/gm
    const matches = [...text.matchAll(headingRegex)]
    return matches.map(m => m[1].trim())
}

function countWords(text) {
    if (!text) return 0
    return text.split(/\s+/).filter(Boolean).length
}

function extractKeyTerms(keyTopicsText) {
    if (!keyTopicsText) return []
    const boldRegex = /\*\*([^*]+)\*\*/g
    const headingRegex = /^#{1,4}\s+(.+)$/gm
    const terms = new Set()
    for (const m of keyTopicsText.matchAll(boldRegex)) {
        const term = m[1].trim()
        if (term.length > 2 && term.length < 50) terms.add(term)
    }
    for (const m of keyTopicsText.matchAll(headingRegex)) {
        const term = m[1].trim()
        if (term.length > 2 && term.length < 50 && !term.toLowerCase().startsWith("primary")
            && !term.toLowerCase().startsWith("key") && !term.toLowerCase().startsWith("content")
            && !term.toLowerCase().startsWith("area") && !term.toLowerCase().startsWith("concept")) {
            terms.add(term)
        }
    }
    return [...terms].slice(0, 10)
}

function extractFAQCount(faqText) {
    if (!faqText) return 0
    const qRegex = /\*\*Q[:.]?\s/gi
    const matches = faqText.match(qRegex)
    if (matches) return matches.length
    const headings = faqText.match(/^#{1,4}\s+.*question/gmi)
    return headings ? headings.length : 0
}

/* ── Visual Insights component ──────────────────────────────────── */

function VisualInsights({ results }) {
    const hasData = results.summary || results.studyGuide || results.faq || results.keyTopics

    const depthScore = (text) => {
        if (!text) return 0
        const words = countWords(text)
        const sections = extractSections(text).length
        const lengthScore = Math.min(words / 8, 100)
        const structureScore = Math.min(sections * 15, 100)
        return Math.round((lengthScore * 0.6 + structureScore * 0.4))
    }

    const depthData = useMemo(() => [
        { name: "Summary", score: depthScore(results.summary), fill: CHART_COLORS[0] },
        { name: "Study Guide", score: depthScore(results.studyGuide), fill: CHART_COLORS[1] },
        { name: "FAQ", score: depthScore(results.faq), fill: CHART_COLORS[2] },
        { name: "Key Topics", score: depthScore(results.keyTopics), fill: CHART_COLORS[3] },
        { name: "Q&A", score: depthScore(results.qa), fill: CHART_COLORS[4] },
    ].filter(d => d.score > 0), [results])

    const keyConceptsData = useMemo(() => {
        const terms = extractKeyTerms(results.keyTopics)
        const allText = `${results.summary} ${results.studyGuide} ${results.faq} ${results.keyTopics} ${results.qa}`.toLowerCase()
        return terms.map(term => {
            const regex = new RegExp(term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
            const matches = allText.match(regex)
            const count = matches ? matches.length : 1
            return {
                name: term.length > 22 ? term.slice(0, 22) + "…" : term,
                relevance: Math.min(count * 5, 100),
                fullName: term
            }
        }).sort((a, b) => b.relevance - a.relevance).slice(0, 8)
    }, [results])

    const coverageData = useMemo(() => [
        { dimension: "Clarity", score: Math.min(extractSections(results.summary).length * 20, 100) || 15 },
        { dimension: "Study Depth", score: Math.min(extractSections(results.studyGuide).length * 15, 100) || 15 },
        { dimension: "FAQ Coverage", score: Math.min(extractFAQCount(results.faq) * 16, 100) || 15 },
        { dimension: "Topic Breadth", score: Math.min(extractSections(results.keyTopics).length * 18, 100) || 15 },
        { dimension: "Interactivity", score: Math.min(extractSections(results.qa).length * 18, 100) || 15 },
    ], [results])

    const analysisDepth = useMemo(() => [
        { name: "Summary", depth: depthScore(results.summary), fill: CHART_COLORS[0] },
        { name: "Study Guide", depth: depthScore(results.studyGuide), fill: CHART_COLORS[1] },
        { name: "FAQ", depth: depthScore(results.faq), fill: CHART_COLORS[2] },
        { name: "Key Topics", depth: depthScore(results.keyTopics), fill: CHART_COLORS[3] },
        { name: "Q&A", depth: depthScore(results.qa), fill: CHART_COLORS[4] },
    ], [results])

    const avgDepth = useMemo(() => {
        const scores = analysisDepth.map(d => d.depth)
        return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
    }, [analysisDepth])

    const totalSections = useMemo(() =>
        extractSections(results.summary).length + extractSections(results.studyGuide).length
        + extractSections(results.keyTopics).length
    , [results])

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No data to visualize yet. Run an analysis first.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Avg Depth Score", value: `${avgDepth}/100`, color: "from-blue-500/15 to-indigo-500/15", textColor: "text-blue-600" },
                    { label: "Sections Covered", value: totalSections, color: "from-violet-500/15 to-purple-500/15", textColor: "text-violet-600" },
                    { label: "Key Concepts", value: keyConceptsData.length, color: "from-cyan-500/15 to-teal-500/15", textColor: "text-cyan-600" },
                    { label: "FAQ Items", value: extractFAQCount(results.faq), color: "from-amber-500/15 to-orange-500/15", textColor: "text-amber-600" },
                ].map(({ label, value, color, textColor }) => (
                    <div key={label} className={`rounded-xl bg-gradient-to-br ${color} border border-border/40 p-4`}>
                        <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
                        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Content Depth Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={depthData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="score">
                                    {depthData.map((entry, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                                </Pie>
                                <Tooltip formatter={(val) => [`${val} / 100`, "Depth Score"]} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                                <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                                    formatter={(value) => { const item = depthData.find(d => d.name === value); const total = depthData.reduce((s, d) => s + d.score, 0); const pct = item ? Math.round((item.score / total) * 100) : 0; return `${value} (${pct}%)` }}
                                    wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Research Coverage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={coverageData} cx="50%" cy="50%" outerRadius="70%">
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                                <Radar name="Coverage" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                                <Tooltip formatter={(val) => [`${val}%`, "Coverage"]} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {keyConceptsData.length > 0 && (
                <Card className="border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Key Concepts — Relevance Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={Math.max(250, keyConceptsData.length * 44)}>
                            <BarChart data={keyConceptsData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={150} />
                                <Tooltip formatter={(val, name, props) => [`${val}%`, `Relevance: ${props.payload.fullName}`]} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                                <Bar dataKey="relevance" radius={[0, 6, 6, 0]}>
                                    {keyConceptsData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            <Card className="border-border/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">Analysis Depth Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={analysisDepth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip formatter={(val) => [`${val} / 100`, "Depth Score"]} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            <Bar dataKey="depth" radius={[6, 6, 0, 0]}>
                                {analysisDepth.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}

/* ── Flashcard component ─────────────────────────────────────────── */
function FlashcardsView({ flashcards, paperId, onRegenerate }) {
    const [flippedCards, setFlippedCards] = useState(new Set())
    const [regenerating, setRegenerating] = useState(false)

    const cards = useMemo(() => {
        if (!flashcards) return []
        try {
            const parsed = typeof flashcards === 'string' ? JSON.parse(flashcards) : flashcards
            return Array.isArray(parsed) ? parsed : []
        } catch { return [] }
    }, [flashcards])

    const toggleFlip = (index) => {
        setFlippedCards(prev => {
            const next = new Set(prev)
            next.has(index) ? next.delete(index) : next.add(index)
            return next
        })
    }

    const handleExport = async () => {
        const token = localStorage.getItem("token")
        try {
            const res = await fetch(`${API_URL}/api/papers/${paperId}/flashcards/export/`, {
                headers: { "Authorization": `Token ${token}` }
            })
            if (res.ok) {
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `flashcards_${paperId}.txt`
                a.click()
                URL.revokeObjectURL(url)
            }
        } catch (err) {
            console.error("Export failed:", err)
        }
    }

    const handleRegenerate = async () => {
        setRegenerating(true)
        const token = localStorage.getItem("token")
        try {
            const res = await fetch(`${API_URL}/api/papers/flashcards/`, {
                method: "POST",
                headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ paper_id: paperId })
            })
            if (res.ok) {
                const data = await res.json()
                onRegenerate?.(data.flashcards)
            }
        } catch (err) {
            console.error("Regenerate failed:", err)
        } finally {
            setRegenerating(false)
        }
    }

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <FlipVertical className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No flashcards yet. Analyze a paper to generate them.</p>
                {paperId && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={handleRegenerate} disabled={regenerating}>
                        {regenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Flashcards</>}
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">{cards.length} flashcards</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
                        {regenerating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />} Regenerate
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-3 w-3 mr-1" /> Export to Anki
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {cards.map((card, i) => (
                    <div key={i} onClick={() => toggleFlip(i)}
                        className="cursor-pointer group perspective-1000">
                        <div className={`relative rounded-xl border-2 p-5 min-h-[140px] flex flex-col justify-center transition-all duration-300
                            ${flippedCards.has(i)
                                ? "bg-gradient-to-br from-primary/10 to-violet-500/10 border-primary/40"
                                : "bg-card border-border/60 hover:border-primary/40 hover:shadow-md"}`}>
                            <div className="absolute top-2 right-3 text-[10px] text-muted-foreground font-mono">
                                {flippedCards.has(i) ? "ANSWER" : "QUESTION"} · {i + 1}/{cards.length}
                            </div>
                            <p className={`text-sm leading-relaxed ${flippedCards.has(i) ? "text-foreground/90" : "font-medium"}`}>
                                {flippedCards.has(i) ? card.back : card.front}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-3 text-center">Click to flip</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── Tables/Figures component ────────────────────────────────────── */
function TablesView({ tablesFigures }) {
    const tables = useMemo(() => {
        if (!tablesFigures) return []
        try {
            const parsed = typeof tablesFigures === 'string' ? JSON.parse(tablesFigures) : tablesFigures
            return Array.isArray(parsed) ? parsed : []
        } catch { return [] }
    }, [tablesFigures])

    if (tables.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Table2 className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No tables extracted. Upload a PDF with tables to see them here.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground font-medium">{tables.length} table(s) extracted from PDF</p>
            {tables.map((table, i) => (
                <Card key={i} className="border-border/50 overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-muted/30">
                        <CardTitle className="text-xs font-semibold text-muted-foreground">
                            Table {table.table_index} · Page {table.page}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/20">
                                    {table.headers?.map((h, j) => (
                                        <th key={j} className="px-4 py-2 text-left font-semibold text-xs text-muted-foreground whitespace-nowrap">{h || "—"}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {table.rows?.map((row, j) => (
                                    <tr key={j} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                        {row.map((cell, k) => (
                                            <td key={k} className="px-4 py-2 text-xs whitespace-nowrap">{cell || "—"}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

/* ── Multi-Paper Feature component (Lit Review + Research Gaps) ─── */
function MultiPaperFeature({ history, featureType }) {
    const [selectedPapers, setSelectedPapers] = useState(new Set())
    const [result, setResult] = useState("")
    const [loading, setLoading] = useState(false)

    const togglePaper = (id) => {
        setSelectedPapers(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const endpoint = featureType === "litReview" ? "literature-review" : "research-gaps"
    const title = featureType === "litReview" ? "Literature Review" : "Research Gaps"

    const handleGenerate = async () => {
        if (selectedPapers.size < 2) return
        setLoading(true)
        const token = localStorage.getItem("token")
        try {
            const res = await fetch(`${API_URL}/api/papers/${endpoint}/`, {
                method: "POST",
                headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ paper_ids: [...selectedPapers] })
            })
            const data = await res.json()
            if (res.ok) {
                setResult(data.review || data.gaps || "")
            } else {
                setResult(`Error: ${data.error || "Failed to generate"}`)
            }
        } catch (err) {
            setResult(`Network error: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-border/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        {featureType === "litReview" ? <BookMarked className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                        Select Papers for {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">Select at least 2 papers from your history to generate a {title.toLowerCase()}.</p>
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {history.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-6">No papers in history. Analyze papers first.</p>
                        ) : history.map((item) => (
                            <label key={item.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                                ${selectedPapers.has(item.id)
                                    ? "bg-primary/10 border border-primary/30"
                                    : "hover:bg-muted/50 border border-transparent"}`}>
                                <input type="checkbox" checked={selectedPapers.has(item.id)}
                                    onChange={() => togglePaper(item.id)}
                                    className="rounded border-border" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <Button onClick={handleGenerate} disabled={selectedPapers.size < 2 || loading}
                        className="w-full py-5 font-semibold">
                        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating {title}...</>
                            : <><Sparkles className="h-4 w-4 mr-2" /> Generate {title} ({selectedPapers.size} papers)</>}
                    </Button>
                </CardContent>
            </Card>

            {(result || loading) && (
                <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="space-y-4">
                                <div className="h-6 w-48 bg-muted animate-pulse rounded-lg" />
                                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
                            </div>
                        ) : (
                            <MarkdownContent content={result} />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

/* ── Markdown renderer component ─────────────────────────────────── */
function MarkdownContent({ content }) {
    if (!content) return null;
    
    // Clean up markdown block wrappers that the AI might add
    let cleanContent = content;
    if (typeof cleanContent === 'string') {
        cleanContent = cleanContent.trim();
        if (cleanContent.startsWith('```markdown')) {
            cleanContent = cleanContent.slice(11);
        } else if (cleanContent.startsWith('```')) {
            cleanContent = cleanContent.slice(3);
        }
        if (cleanContent.endsWith('```')) {
            cleanContent = cleanContent.slice(0, -3);
        }
        cleanContent = cleanContent.trim();
    }

    return (
        <div className="prose prose-sm max-w-none dark:prose-invert
            prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-6
            prose-p:text-foreground/90 prose-p:leading-relaxed
            prose-strong:text-foreground prose-li:text-foreground/90
            prose-ul:my-4 prose-ol:my-4
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border
            prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
        </div>
    )
}

/* ── Chat message component ──────────────────────────────────────── */
function ChatMessage({ message }) {
    const isUser = message.role === "user"
    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-gradient-to-br from-violet-500 to-blue-500 text-white"
                }`}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm
                ${isUser
                    ? "bg-primary text-primary-foreground rounded-tr-md"
                    : "bg-muted/60 border border-border rounded-tl-md"
                }`}>
                {isUser ? <p>{message.content}</p> : <MarkdownContent content={message.content} />}
            </div>
        </div>
    )
}

/* ── Main component ──────────────────────────────────────────────── */
export function SummarizerPage() {
    const navigate = useNavigate()
    const chatEndRef = useRef(null)
    const chatInputRef = useRef(null)

    const [files, setFiles] = useState([])
    const [text, setText] = useState("")
    const [title, setTitle] = useState("")
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedModel, setSelectedModel] = useState("deepseek-chat")
    const [showModelSelector, setShowModelSelector] = useState(false)
    const [activeTab, setActiveTab] = useState("summary")
    const [currentPaperId, setCurrentPaperId] = useState(null)
    const [customPrompt, setCustomPrompt] = useState("")
    const [showCustomPrompt, setShowCustomPrompt] = useState(false)

    // Chat state
    const [chatMessages, setChatMessages] = useState([])
    const [chatInput, setChatInput] = useState("")
    const [chatLoading, setChatLoading] = useState(false)

    const [results, setResults] = useState({
        summary: "", qa: "", studyGuide: "", faq: "", keyTopics: "", flashcards: "[]", tablesFigures: "[]"
    })

    useEffect(() => { fetchHistory() }, [])
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [chatMessages])

    const fetchHistory = async () => {
        const token = localStorage.getItem("token")
        if (!token) return
        try {
            const response = await fetch(`${API_URL}/api/papers/history/`, {
                headers: { "Authorization": `Token ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setHistory(data)
            }
        } catch (err) {
            console.error("Failed to fetch history:", err)
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'text/markdown': ['.md']
        },
        onDrop: (acceptedFiles) => {
            setFiles(prev => [...prev, ...acceptedFiles])
            if (acceptedFiles.length > 0) {
                setTitle(acceptedFiles[0].name.replace(/\.[^/.]+$/, ""))
            }
        }
    })

    const removeFile = (index) => { setFiles(files.filter((_, i) => i !== index)) }

    const handleAnalyzeClick = () => {
        if (files.length === 0 && !text.trim()) return
        setShowModelSelector(true)
    }

    const handleDeletePaper = async (paperId, e) => {
        e.stopPropagation()
        if (!confirm("Delete this paper and its analysis?")) return
        const token = localStorage.getItem("token")
        try {
            const res = await fetch(`${API_URL}/api/papers/${paperId}/delete/`, {
                method: "DELETE",
                headers: { "Authorization": `Token ${token}` }
            })
            if (res.ok) {
                setHistory(prev => prev.filter(p => p.id !== paperId))
                if (currentPaperId === paperId) {
                    setCurrentPaperId(null)
                    setResults({ summary: "", qa: "", studyGuide: "", faq: "", keyTopics: "", flashcards: "[]", tablesFigures: "[]" })
                    setTitle("")
                    setChatMessages([])
                }
            }
        } catch (err) { console.error("Delete failed:", err) }
    }

    const loadPastResult = (item) => {
        setResults({
            summary: item.analysis.summary,
            qa: item.analysis.qa,
            studyGuide: item.analysis.study_guide,
            faq: item.analysis.faq,
            keyTopics: item.analysis.key_topics,
            flashcards: item.analysis.flashcards || "[]",
            tablesFigures: item.analysis.tables_figures || "[]"
        })
        setTitle(item.title)
        setCurrentPaperId(item.id)
        setActiveTab("summary")
        setChatMessages([{ role: "assistant", content: item.analysis.qa || "I've analyzed this paper. Ask me anything about it!" }])
    }

    const handleAnalyze = async () => {
        setShowModelSelector(false)
        setLoading(true)
        const token = localStorage.getItem("token")

        try {
            const formData = new FormData()
            formData.append("model", selectedModel)
            if (customPrompt.trim()) formData.append("custom_prompt", customPrompt)

            if (files.length > 0) {
                formData.append("file", files[0])
                formData.append("title", title || files[0].name.replace(/\.[^/.]+$/, ""))
            } else {
                formData.append("content", text)
                formData.append("title", title || "Untitled Research")
            }

            const response = await fetch(`${API_URL}/api/papers/analyze/`, {
                method: "POST",
                headers: { "Authorization": `Token ${token}` },
                body: formData
            })

            const data = await response.json()

            if (response.ok) {
                setResults({
                    summary: data.analysis.summary,
                    qa: data.analysis.qa,
                    studyGuide: data.analysis.study_guide,
                    faq: data.analysis.faq,
                    keyTopics: data.analysis.key_topics,
                    flashcards: data.analysis.flashcards || "[]",
                    tablesFigures: data.analysis.tables_figures || "[]"
                })
                setCurrentPaperId(data.id)
                setActiveTab("summary")
                setChatMessages([{ role: "assistant", content: data.analysis.qa || "I've analyzed this paper. Ask me anything about it!" }])
                fetchHistory()
            } else {
                if (response.status === 401) {
                    localStorage.removeItem("token")
                    localStorage.removeItem("user")
                    alert("Session expired. Please log in again.")
                    navigate("/login")
                } else {
                    alert(`Analysis failed: ${data.error || 'Unknown error'}`)
                }
            }
        } catch (err) {
            alert("Network Error: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChatSend = async () => {
        if (!chatInput.trim() || !currentPaperId || chatLoading) return
        const userMsg = { role: "user", content: chatInput.trim() }
        setChatMessages(prev => [...prev, userMsg])
        setChatInput("")
        setChatLoading(true)

        const token = localStorage.getItem("token")
        try {
            const response = await fetch(`${API_URL}/api/papers/chat/`, {
                method: "POST",
                headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ paper_id: currentPaperId, message: userMsg.content })
            })
            const data = await response.json()
            if (response.ok) {
                setChatMessages(prev => [...prev, { role: "assistant", content: data.answer }])
            } else {
                setChatMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${data.error || "Failed to get response"}` }])
            }
        } catch (err) {
            setChatMessages(prev => [...prev, { role: "assistant", content: `⚠️ Network error: ${err.message}` }])
        } finally {
            setChatLoading(false)
            chatInputRef.current?.focus()
        }
    }

    const handleChatKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend() }
    }

    /* ── Render ───────────────────────────────────────────────────── */
    return (
        <div className="flex-1 w-full bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-1 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-xl">
                            <Sparkles className="h-7 w-7 text-primary" />
                        </div>
                        AI Research Assistant
                    </h1>
                    <p className="text-muted-foreground ml-14">
                        Upload papers, get instant analysis, flashcards, literature reviews, and more
                    </p>
                </div>

                {/* Model Selector Modal */}
                {showModelSelector && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-2xl shadow-2xl border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="h-5 w-5 text-primary" />
                                    Select AI Model
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 max-h-[35vh] overflow-y-auto">
                                    {AI_MODELS.map((model) => (
                                        <div key={model.value}
                                            className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                                                selectedModel === model.value
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                                            }`}
                                            onClick={() => setSelectedModel(model.value)}>
                                            <div className="text-3xl">{model.icon}</div>
                                            <div className="flex-1">
                                                <div className="font-semibold">{model.label}</div>
                                                <div className="text-sm text-muted-foreground">{model.provider}</div>
                                            </div>
                                            {selectedModel === model.value && <div className="h-3 w-3 rounded-full bg-primary" />}
                                        </div>
                                    ))}
                                </div>

                                {/* Custom AI Prompt */}
                                <div className="border-t border-border/40 pt-4">
                                    <button onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left">
                                        <Settings2 className="h-4 w-4" />
                                        <span className="font-medium">Custom Instructions</span>
                                        <span className="ml-auto text-xs">{showCustomPrompt ? "▲" : "▼"}</span>
                                    </button>
                                    {showCustomPrompt && (
                                        <Textarea
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            placeholder="E.g., 'Focus on statistical methods' or 'Analyze from a sociological lens' or 'Keep answers at undergraduate level'..."
                                            className="mt-3 min-h-[80px] text-sm resize-none"
                                        />
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button onClick={handleAnalyze} className="flex-1 py-6 text-base font-semibold">
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Start Analysis
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowModelSelector(false)}>Cancel</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
                    {/* ── Left sidebar ────────────────────────────────────── */}
                    <div className="space-y-5">
                        {/* History */}
                        <Card className="border-border/60">
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-xs flex items-center gap-2 uppercase tracking-widest text-muted-foreground font-semibold">
                                    <History className="h-3.5 w-3.5" />
                                    Saved Research
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="max-h-[260px] overflow-y-auto px-2 pb-3">
                                {history.length === 0 ? (
                                    <p className="text-xs text-center text-muted-foreground py-6">No saved papers yet</p>
                                ) : (
                                    <div className="space-y-1">
                                        {history.map((item) => (
                                            <div key={item.id}
                                                className={`relative group w-full text-left p-3 rounded-lg transition-all cursor-pointer
                                                    ${currentPaperId === item.id
                                                        ? "bg-primary/10 border border-primary/30"
                                                        : "hover:bg-muted/50 border border-transparent hover:border-border"
                                                    }`}
                                                onClick={() => loadPastResult(item)}>
                                                <div className="text-sm font-medium truncate group-hover:text-primary pr-7">
                                                    {item.title}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                                <button onClick={(e) => handleDeletePaper(item.id, e)}
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                                    title="Delete paper">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upload */}
                        <Card className="border-border/60">
                            <CardHeader className="py-3 px-4 border-b border-border/40">
                                <CardTitle className="text-xs flex items-center gap-2 uppercase tracking-widest text-muted-foreground font-semibold">
                                    <Upload className="h-3.5 w-3.5" />
                                    New Source
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div {...getRootProps()}
                                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200
                                        ${isDragActive
                                            ? "border-primary bg-primary/10"
                                            : "border-border/60 hover:border-primary/50 hover:bg-muted/30"}`}>
                                    <input {...getInputProps()} />
                                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                                    {files.length > 0 ? (
                                        <p className="text-sm font-medium text-primary truncate">{files[0].name}</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Drop a PDF, DOCX, or TXT file here</p>
                                    )}
                                </div>

                                {files.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeFile(0) }}
                                        className="w-full text-destructive hover:text-destructive">
                                        <X className="h-4 w-4 mr-2" /> Remove File
                                    </Button>
                                )}

                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Or paste text</Label>
                                    <Textarea placeholder="Paste research content here..."
                                        className="min-h-[120px] text-xs resize-none"
                                        value={text} onChange={(e) => setText(e.target.value)} />
                                </div>

                                <Button onClick={handleAnalyzeClick} className="w-full py-5 font-semibold"
                                    disabled={loading || (files.length === 0 && !text.trim())}>
                                    {loading
                                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                                        : <><Sparkles className="h-4 w-4 mr-2" /> Analyze with AI</>}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Main content area ────────────────────────────────── */}
                    <div className="min-w-0">
                        <div className="mb-5">
                            <h2 className="text-2xl font-bold text-foreground">{title || "Start New Analysis"}</h2>
                            {title && <p className="text-sm text-muted-foreground mt-0.5">Select a tab to explore different perspectives</p>}
                        </div>

                        {/* Tab bar */}
                        {(!!results.summary || loading) && (
                            <div className="flex gap-1 mb-6 p-1 bg-muted/40 rounded-xl border border-border/40 overflow-x-auto">
                                {TABS.map(({ key, label, icon: Icon }) => (
                                    <button key={key} onClick={() => setActiveTab(key)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                                            ${activeTab === key
                                                ? "bg-background text-foreground shadow-sm border border-border/60"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {loading && (
                            <div className="space-y-4">
                                <div className="h-6 w-48 bg-muted animate-pulse rounded-lg" />
                                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
                                <div className="h-20 w-full bg-muted animate-pulse rounded-lg mt-4" />
                            </div>
                        )}

                        {/* Standard text tabs */}
                        {!!results.summary && !loading && ["summary", "studyGuide", "faq", "keyTopics"].includes(activeTab) && (
                            <Card className="border-border/50 shadow-sm">
                                <CardContent className="p-6">
                                    <MarkdownContent content={
                                        activeTab === "summary" ? results.summary :
                                        activeTab === "studyGuide" ? results.studyGuide :
                                        activeTab === "faq" ? results.faq :
                                        activeTab === "keyTopics" ? results.keyTopics : ""
                                    } />
                                </CardContent>
                            </Card>
                        )}

                        {/* Flashcards tab */}
                        {!!results.summary && !loading && activeTab === "flashcards" && (
                            <Card className="border-border/50 shadow-sm">
                                <CardContent className="p-6">
                                    <FlashcardsView
                                        flashcards={results.flashcards}
                                        paperId={currentPaperId}
                                        onRegenerate={(newCards) => setResults(prev => ({ ...prev, flashcards: JSON.stringify(newCards) }))}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Tables tab */}
                        {!!results.summary && !loading && activeTab === "tables" && (
                            <TablesView tablesFigures={results.tablesFigures} />
                        )}

                        {/* Analytics tab */}
                        {!!results.summary && !loading && activeTab === "analytics" && <VisualInsights results={results} />}

                        {/* Literature Review tab */}
                        {!!results.summary && !loading && activeTab === "litReview" && (
                            <MultiPaperFeature history={history} featureType="litReview" />
                        )}

                        {/* Research Gaps tab */}
                        {!!results.summary && !loading && activeTab === "researchGaps" && (
                            <MultiPaperFeature history={history} featureType="researchGaps" />
                        )}

                        {/* Chat tab */}
                        {!!results.summary && !loading && activeTab === "chat" && (
                            <Card className="border-border/50 shadow-sm flex flex-col min-h-[500px] lg:h-[calc(100vh-280px)]">
                                <CardContent className="flex-1 overflow-y-auto p-5 space-y-5">
                                    {chatMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                            <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No conversation yet</p>
                                            <p className="text-xs mt-1">Analyze a paper first, then ask questions here</p>
                                        </div>
                                    ) : (
                                        <>
                                            {chatMessages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
                                            {chatLoading && (
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                                                        <Bot className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div className="bg-muted/60 border border-border rounded-2xl rounded-tl-md px-4 py-3">
                                                        <div className="flex gap-1.5">
                                                            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={chatEndRef} />
                                        </>
                                    )}
                                </CardContent>

                                <div className="border-t border-border/40 p-4">
                                    <div className="flex gap-3 items-end">
                                        <Textarea ref={chatInputRef} value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={handleChatKeyDown}
                                            placeholder={currentPaperId ? "Ask a question about this paper..." : "Analyze a paper first to start chatting"}
                                            disabled={!currentPaperId || chatLoading}
                                            className="min-h-[44px] max-h-[120px] resize-none text-sm" rows={1} />
                                        <Button onClick={handleChatSend}
                                            disabled={!chatInput.trim() || !currentPaperId || chatLoading}
                                            size="icon" className="h-[44px] w-[44px] shrink-0">
                                            {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-2">
                                        Press Enter to send · Shift+Enter for new line
                                    </p>
                                </div>
                            </Card>
                        )}

                        {/* Empty state */}
                        {!results.summary && !loading && !["chat", "analytics", "litReview", "researchGaps", "flashcards", "tables"].includes(activeTab) && (
                            <div className="flex flex-col items-center justify-center py-32 mt-6 bg-muted/10 rounded-2xl border-2 border-dashed border-border/40">
                                <div className="p-4 bg-gradient-to-br from-primary/10 to-violet-500/10 rounded-2xl mb-4">
                                    <Sparkles className="h-10 w-10 text-primary/40" />
                                </div>
                                <p className="text-muted-foreground font-medium text-sm">Upload a paper or paste text to begin</p>
                                <p className="text-muted-foreground/60 text-xs mt-1">Supports PDF, DOCX, TXT, and MD files</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
