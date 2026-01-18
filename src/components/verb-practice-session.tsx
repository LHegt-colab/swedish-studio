"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2, Check, X, ArrowRight, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { VerbConjugation } from "@/types/database"
import confetti from 'canvas-confetti'

export function VerbPracticeSession() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [verbs, setVerbs] = useState<VerbConjugation[]>([])
    const [queue, setQueue] = useState<VerbConjugation[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)

    // Inputs
    const [present, setPresent] = useState("")
    const [past, setPast] = useState("")
    const [supine, setSupine] = useState("")
    const [future, setFuture] = useState("")

    const [status, setStatus] = useState<'answering' | 'checked'>('answering')
    const [results, setResults] = useState({
        present: false,
        past: false,
        supine: false,
        future: false
    })
    const [sessionComplete, setSessionComplete] = useState(false)
    const [score, setScore] = useState(0)

    useEffect(() => {
        loadVerbs()
    }, [])

    async function loadVerbs() {
        setLoading(true)
        const { data } = await supabase.from('verb_conjugations').select('*')
        if (data && data.length > 0) {
            setVerbs(data)
            // Pick random 10
            const shuffled = [...data].sort(() => 0.5 - Math.random()).slice(0, 10)
            setQueue(shuffled)
        }
        setLoading(false)
    }

    const currentVerb = queue[currentIndex]

    const normalize = (s: string) => s.trim().toLowerCase().replace(/[.,]/g, '')

    const checkAnswers = () => {
        if (!currentVerb) return

        const r = {
            present: normalize(present) === normalize(currentVerb.present),
            past: normalize(past) === normalize(currentVerb.past),
            supine: normalize(supine) === normalize(currentVerb.supine),
            future: normalize(future) === normalize(currentVerb.future)
        }
        setResults(r)

        // Full correct?
        const allCorrect = Object.values(r).every(Boolean)
        if (allCorrect) {
            setScore(s => s + 1)
            toast.success("Alles correct!")
        } else {
            toast.warning("Niet alles is goed, kijk naar de correcties.")
        }

        setStatus('checked')
    }

    const nextVerb = () => {
        if (currentIndex + 1 >= queue.length) {
            setSessionComplete(true)
            confetti()
        } else {
            setCurrentIndex(i => i + 1)
            // Reset
            setPresent("")
            setPast("")
            setSupine("")
            setFuture("")
            setStatus('answering')
            setResults({ present: false, past: false, supine: false, future: false })
        }
    }

    const retry = () => {
        setSessionComplete(false)
        setCurrentIndex(0)
        setScore(0)
        loadVerbs()
    }

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
    if (verbs.length === 0) return <div className="p-10 text-center">Nog geen werkwoorden gevonden. Importeer ze eerst!</div>

    if (sessionComplete) {
        return (
            <Card className="max-w-xl mx-auto text-center py-10">
                <CardTitle className="text-4xl mb-4">Sessie Compleet! 🎉</CardTitle>
                <CardContent>
                    <div className="text-6xl font-black text-primary mb-4">{score} / {queue.length}</div>
                    <p className="text-muted-foreground">Werkwoorden volledig correct vervoegd.</p>
                    <Button className="mt-8" onClick={retry}><RefreshCw className="mr-2 h-4 w-4" /> Nog een keer</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Werkwoord {currentIndex + 1} / {queue.length}</span>
                <span>Score: {score}</span>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">{currentVerb.group_name}</p>
                            <CardTitle className="text-4xl text-primary">{currentVerb.infinitive}</CardTitle>
                            {currentVerb.translation && <p className="text-lg text-muted-foreground mt-2">{currentVerb.translation}</p>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Presens */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Presens (Tegenwoordige tijd)</label>
                            <div className="relative">
                                <Input
                                    value={present}
                                    onChange={e => setPresent(e.target.value)}
                                    disabled={status === 'checked'}
                                    className={status === 'checked' ? (results.present ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20") : ""}
                                    placeholder="bijv. lagar"
                                />
                                {status === 'checked' && !results.present && (
                                    <div className="text-xs text-red-500 mt-1 font-semibold">Correct: {currentVerb.present}</div>
                                )}
                            </div>
                        </div>

                        {/* Preteritum */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Preteritum (Verleden tijd)</label>
                            <div className="relative">
                                <Input
                                    value={past}
                                    onChange={e => setPast(e.target.value)}
                                    disabled={status === 'checked'}
                                    className={status === 'checked' ? (results.past ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20") : ""}
                                    placeholder="bijv. lagade"
                                />
                                {status === 'checked' && !results.past && (
                                    <div className="text-xs text-red-500 mt-1 font-semibold">Correct: {currentVerb.past}</div>
                                )}
                            </div>
                        </div>

                        {/* Supine */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Perfekt (Voltooid)</label>
                            <div className="relative flex items-center gap-2">
                                <span className="text-muted-foreground text-sm font-medium">har</span>
                                <div className="w-full">
                                    <Input
                                        value={supine}
                                        onChange={e => setSupine(e.target.value)}
                                        disabled={status === 'checked'}
                                        className={status === 'checked' ? (results.supine ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20") : ""}
                                        placeholder="bijv. lagat"
                                    />
                                    {status === 'checked' && !results.supine && (
                                        <div className="text-xs text-red-500 mt-1 font-semibold">Correct: {currentVerb.supine}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Future */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Futurum (Toekomend)</label>
                            <div className="relative flex items-center gap-2">
                                <span className="text-muted-foreground text-sm font-medium">ska</span>
                                <div className="w-full">
                                    <Input
                                        value={future}
                                        onChange={e => setFuture(e.target.value)}
                                        disabled={status === 'checked'}
                                        className={status === 'checked' ? (results.future ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20") : ""}
                                        placeholder="bijv. laga"
                                    />
                                    {status === 'checked' && !results.future && (
                                        <div className="text-xs text-red-500 mt-1 font-semibold">Correct: {currentVerb.future}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-4">
                    {status === 'answering' ? (
                        <Button onClick={checkAnswers} size="lg" className="w-full md:w-auto">Controleren</Button>
                    ) : (
                        <Button onClick={nextVerb} size="lg" className="w-full md:w-auto">
                            Volgende <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
