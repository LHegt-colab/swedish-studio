"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, RefreshCw, Check, Clock } from "lucide-react"
import { toast } from "sonner"
import type { VocabItem } from "@/types/database"
import { calculateSRS } from "@/lib/srs"
import Link from "next/link"
import confetti from 'canvas-confetti'

export function SRSSession() {
    const [items, setItems] = useState<VocabItem[]>([])
    const [queue, setQueue] = useState<VocabItem[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showBack, setShowBack] = useState(false)
    const [loading, setLoading] = useState(true)
    const [sessionComplete, setSessionComplete] = useState(false)
    const [sessionStats, setSessionStats] = useState({ reviewed: 0 })

    const supabase = createClient()

    useEffect(() => {
        loadDueItems()
    }, [])

    async function loadDueItems() {
        setLoading(true)
        const now = new Date().toISOString()

        // Fetch items where next_review is null (new) or in the past
        const { data } = await supabase
            .from('vocab_items')
            .select('*')
            .or(`next_review.is.null,next_review.lte.${now}`)
            .limit(50) // Limit batch size

        if (data) {
            setItems(data)
            setQueue(data) // Initial queue
        }
        setLoading(false)
    }

    const handleRate = async (quality: number) => {
        const item = queue[currentIndex]

        // Calculate new SRS params
        const { interval, easeFactor, repetitions } = calculateSRS(
            quality,
            item.interval,
            item.ease_factor,
            item.repetitions
        )

        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + interval)

        // Optimistic UI update
        // We don't remove from queue immediately if quality < 3 (Again), typically SRS repeats in session
        // But for simplicity in this V1, we just schedule it. 
        // Improvement: If quality < 3, re-queue at end of session array.

        let nextQueue = [...queue]
        if (quality < 3) {
            // Re-queue at end for immediate re-test
            // But we shouldn't update DB yet if we want true "learning" step.
            // Simplified approach: Update DB -> schedule for 1 day (SRS util handles this: interval=1)
        }

        // Update DB
        const { error } = await supabase.from('vocab_items').update({
            interval,
            ease_factor: easeFactor,
            repetitions,
            next_review: nextDate.toISOString(),
            last_review: new Date().toISOString()
        }).eq('id', item.id)

        if (error) {
            toast.error("Fout bij opslaan voortgang")
            return
        }

        // Save Attempt for Stats
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('practice_attempts').insert({
                user_id: user.id,
                vocab_id: item.id,
                is_correct: quality >= 3,
                item_type: 'vocab_srs',
                metadata: { quality, interval }
            })
        }

        setSessionStats(st => ({ reviewed: st.reviewed + 1 }))

        if (currentIndex < queue.length - 1) {
            setCurrentIndex(i => i + 1)
            setShowBack(false)
        } else {
            confetti()
            setSessionComplete(true)
        }
    }

    if (loading) return <div className="p-10 text-center">Laden van kaarten...</div>

    if (sessionComplete) {
        return (
            <div className="max-w-md mx-auto text-center space-y-6 py-10">
                <Card className="p-8">
                    <h2 className="text-3xl font-bold mb-4">Sessie Compleet! 🎉</h2>
                    <p className="text-muted-foreground mb-6">Je hebt {sessionStats.reviewed} items gereviewed.</p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/dashboard"><Button>Terug naar Dashboard</Button></Link>
                        <Link href="/woordjes"><Button variant="outline">Woordjes Lijst</Button></Link>
                    </div>
                </Card>
            </div>
        )
    }

    if (queue.length === 0) {
        return (
            <div className="max-w-md mx-auto text-center space-y-6 py-10">
                <Card className="p-8">
                    <h2 className="text-2xl font-bold mb-4">Alles bijgewerkt! ☀️</h2>
                    <p className="text-muted-foreground mb-6">Geen items die nu herhaling nodig hebben.</p>
                    <Link href="/woordjes"><Button>Ga naar Woordjes</Button></Link>
                </Card>
            </div>
        )
    }

    const currentItem = queue[currentIndex]

    return (
        <div className="max-w-2xl mx-auto space-y-6 flex flex-col h-[calc(100vh-140px)]">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <Link href="/dashboard" className="flex items-center hover:text-primary"><ArrowLeft className="mr-1 h-3 w-3" /> Stoppen</Link>
                <span>{currentIndex + 1} / {queue.length}</span>
            </div>

            <div className="flex-1 flex flex-col">
                <div className="flex-1 perspective-1000 relative">
                    <div
                        className="bg-card border shadow-lg rounded-xl h-full flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all hover:shadow-xl"
                        onClick={() => setShowBack(true)}
                    >
                        <div className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Zweeds</div>
                        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-8">{currentItem.sv_word}</h1>

                        {showBack ? (
                            <div className="animate-in fade-in zoom-in duration-300 w-full pt-8 border-t">
                                <div className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Nederlands</div>
                                <h2 className="text-3xl text-foreground font-medium">{currentItem.nl_word}</h2>
                                {currentItem.example_sentence && (
                                    <p className="mt-4 text-muted-foreground italic">"{currentItem.example_sentence}"</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground animate-pulse mt-10">Klik om antwoord te zien</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="h-24">
                {showBack ? (
                    <div className="grid grid-cols-4 gap-4 h-full">
                        <div className="flex flex-col gap-1">
                            <Button variant="destructive" className="h-full flex flex-col gap-1" onClick={() => handleRate(0)}>Opnieuw</Button>
                            <span className="text-xs text-center text-muted-foreground">1 min</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Button variant="secondary" className="h-full bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-200" onClick={() => handleRate(3)}>Moeilijk</Button>
                            <span className="text-xs text-center text-muted-foreground">Okee</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Button variant="secondary" className="h-full bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200" onClick={() => handleRate(4)}>Goed</Button>
                            <span className="text-xs text-center text-muted-foreground">Goed</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Button variant="secondary" className="h-full bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200" onClick={() => handleRate(5)}>Makkelijk</Button>
                            <span className="text-xs text-center text-muted-foreground">Perfect</span>
                        </div>
                    </div>
                ) : (
                    <Button className="w-full h-full text-lg" onClick={() => setShowBack(true)}>Toon Antwoord</Button>
                )}
            </div>
        </div>
    )
}
