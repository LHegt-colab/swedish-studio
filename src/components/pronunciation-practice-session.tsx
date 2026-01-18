"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Star, UploadCloud, Check, Volume2 } from "lucide-react"
import { AudioPlayer } from "@/components/audio-player"
import { AudioRecorder } from "@/components/audio-recorder"
import { toast } from "sonner"
import type { PronunciationItem } from "@/types/database"
import Link from 'next/link'
import confetti from 'canvas-confetti'

export function PronunciationPracticeSession() {
    const [step, setStep] = useState<'select' | 'practice' | 'summary'>('select')
    const [items, setItems] = useState<PronunciationItem[]>([])
    const [queue, setQueue] = useState<PronunciationItem[]>([])

    // Session State
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentRecording, setCurrentRecording] = useState<Blob | null>(null)
    const [rating, setRating] = useState<number>(0)
    const [isSaving, setIsSaving] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from('pronunciation_items').select('*')
            if (data) setItems(data)
        }
        load()
    }, [])

    const startSession = async (selectedItems: PronunciationItem[]) => {
        if (selectedItems.length === 0) return toast.error("Kies items")
        setQueue(selectedItems)
        setStep('practice')
        setCurrentIndex(0)

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase.from('practice_sessions').insert({
                user_id: user.id, mode: 'pronunciation', total_items: selectedItems.length, score: 0
            }).select().single()
            if (data) setSessionId(data.id)
        }
    }

    const handleRecordingComplete = (blob: Blob) => {
        setCurrentRecording(blob)
    }

    const handleNext = async () => {
        if (!rating) return toast.error("Geef jezelf een cijfer")
        setIsSaving(true)
        const item = queue[currentIndex]
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            let recordingUrl = ""
            let storageKey = ""

            // Upload Recording if exists
            if (currentRecording) {
                const ext = "webm"
                const filename = `${user.id}/recordings/${item.id}_${Date.now()}.${ext}`
                const { data: uploadData, error } = await supabase.storage
                    .from('pronunciation-audio')
                    .upload(filename, currentRecording)

                if (!error) {
                    storageKey = uploadData.path
                    const { data: { publicUrl } } = supabase.storage.from('pronunciation-audio').getPublicUrl(storageKey)
                    recordingUrl = publicUrl

                    // Create Recording Record
                    await supabase.from('pronunciation_recordings').insert({
                        user_id: user.id,
                        item_id: item.id,
                        recording_url: recordingUrl,
                        storage_key: storageKey
                    })
                }
            }

            // Save Attempt
            if (sessionId) {
                await supabase.from('practice_attempts').insert({
                    session_id: sessionId,
                    user_id: user.id,
                    pronunciation_id: item.id,
                    item_type: 'pronunciation',
                    is_correct: rating >= 3, // Arbitrary success threshold
                    metadata: { self_rating: rating, recording_url: recordingUrl }
                })
            }
        }

        if (currentIndex < queue.length - 1) {
            setCurrentIndex(i => i + 1)
            setCurrentRecording(null)
            setRating(0)
        } else {
            confetti()
            setStep('summary')
        }
        setIsSaving(false)
    }

    // --- RENDER ---

    if (step === 'select') {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/uitspraak">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Start Oefening</h1>
                </div>
                <div className="grid gap-4">
                    <Card className="hover:bg-accent/50 cursor-pointer" onClick={() => startSession(items)}>
                        <CardHeader>
                            <CardTitle>Alles Oefenen ({items.length})</CardTitle>
                        </CardHeader>
                    </Card>
                    {/* Could add selection logic here, keeping it simple for now */}
                </div>
            </div>
        )
    }

    if (step === 'practice') {
        const item = queue[currentIndex]
        const progress = ((currentIndex) / queue.length) * 100

        return (
            <div className="max-w-xl mx-auto space-y-8 py-6">
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Item {currentIndex + 1} / {queue.length}</div>
                        <CardTitle className="text-3xl">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-8">
                        <div className="text-center space-y-4">
                            <div className="text-2xl font-medium">{item.sv_text}</div>
                            {item.ipa && <div className="text-sm font-mono text-muted-foreground">[{item.ipa}]</div>}
                        </div>

                        {/* Reference Audio or TTS */}
                        {item.audio_reference_url ? (
                            <div className="border p-4 rounded-xl bg-muted/30 w-full flex flex-col items-center">
                                <div className="text-xs text-muted-foreground mb-2">Luister naar voorbeeld</div>
                                <AudioPlayer src={item.audio_reference_url} />
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full h-20 flex flex-col gap-2"
                                onClick={() => {
                                    const u = new SpeechSynthesisUtterance(item.sv_text || item.title)
                                    u.lang = 'sv-SE'
                                    window.speechSynthesis.speak(u)
                                }}
                            >
                                <Volume2 className="h-6 w-6" />
                                <span>Luister (TTS)</span>
                            </Button>
                        )}

                        {/* User Action */}
                        <div className="border-t pt-6 w-full flex flex-col items-center gap-4">
                            <div className="text-sm font-semibold">Jouw Beurt</div>
                            <AudioRecorder onRecordingComplete={handleRecordingComplete} isUploading={isSaving} />

                            {currentRecording && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 w-full flex flex-col items-center pt-4">
                                    <div className="text-sm text-muted-foreground">Hoe ging het?</div>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(r => (
                                            <Button
                                                key={r}
                                                variant={rating === r ? "default" : "outline"}
                                                size="icon"
                                                onClick={() => setRating(r)}
                                                className="rounded-full w-10 h-10"
                                            >
                                                <Star className={`h-4 w-4 ${rating >= r ? "fill-current" : ""}`} />
                                            </Button>
                                        ))}
                                    </div>
                                    <Button onClick={handleNext} disabled={rating === 0 || isSaving} className="w-full max-w-[200px]">
                                        {isSaving ? <UploadCloud className="animate-pulse mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                                        Volgende
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto text-center space-y-6 py-10">
            <Card className="p-8">
                <h2 className="text-3xl font-bold mb-4">Klaar! 🎤</h2>
                <p className="text-muted-foreground mb-6">Je hebt alle items geoefend.</p>
                <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => window.location.reload()}>Opnieuw</Button>
                    <Link href="/uitspraak"><Button>Terug naar Overzicht</Button></Link>
                </div>
            </Card>
        </div>
    )
}
