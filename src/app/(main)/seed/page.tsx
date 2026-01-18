"use client"
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { toast } from 'sonner'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { seedVocab, seedGrammar, seedReading, seedPronunciation } from '@/lib/seed-data'
import { Database, Zap, BookOpen, FileText, Mic } from 'lucide-react'

export default function SeedPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const [stats, setStats] = useState<{ userId: string, vocabCount: number }>({ userId: '', vocabCount: 0 })

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev])

    // Load initial stats
    useState(() => {
        checkStats()
    })

    async function checkStats() {
        addLog("Checking stats...")
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) addLog(`Auth Error: ${authError.message}`)

        if (user) {
            const { count, error: countError } = await supabase.from('vocab_items').select('*', { count: 'exact', head: true })
            if (countError) addLog(`DB Count Error: ${countError.message}`)

            setStats({ userId: user.id, vocabCount: count || 0 })
            addLog(`User: ${user.email} (${user.id})`)
            addLog(`Current Vocab Items in DB: ${count}`)
        } else {
            addLog("No active user found.")
        }
    }

    const ensureProfile = async (user: any) => {
        addLog("Checking if profile exists...")
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()

        if (!profile) {
            addLog("Profile missing! Creating public profile...")
            const { error } = await supabase.from('profiles').insert({
                id: user.id,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Student",
                avatar_url: user.user_metadata?.avatar_url
            })
            if (error) {
                addLog(`CRITICAL: Could not create profile. ${error.message}`)
                throw error
            }
            addLog("Profile created successfully.")
        } else {
            addLog("Profile exists.")
        }
    }

    const handleSeedVocab = async () => {
        if (!confirm("Dit voegt 500 woordjes toe. Doorgaan?")) return
        setLoading(true)
        addLog("Starting Vocab Seed...")

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("Je bent niet ingelogd!")
            addLog("Error: Not logged in")
            setLoading(false)
            return
        }

        try {
            await ensureProfile(user)
        } catch (e) {
            toast.error("Fout bij profiel check. Zie logs.")
            setLoading(false)
            return
        }

        // 1. Fetch existing words to avoid conflicts manually
        addLog("Fetching existing words...")
        const { data: existingData, error: fetchError } = await supabase
            .from('vocab_items')
            .select('sv_word')

        if (fetchError) {
            console.error("Fetch Error:", fetchError)
            addLog(`Fetch Error: ${fetchError.message}`)
            toast.error("Kon bestaande woorden niet ophalen.")
            setLoading(false)
            return
        }

        const existingSet = new Set(existingData?.map(i => i.sv_word.toLowerCase()) || [])
        addLog(`Found ${existingSet.size} existing words.`)

        // 2. Filter seed data
        const newItems = seedVocab.filter(item => !existingSet.has(item.sv.toLowerCase()))
        addLog(`New words to insert: ${newItems.length}`)

        if (newItems.length === 0) {
            toast.warning("Alle woorden bestaan al!")
            addLog("All words already exist. Aborting.")
            setLoading(false)
            return
        }

        let count = 0
        const batchSize = 50
        for (let i = 0; i < newItems.length; i += batchSize) {
            const batch = newItems.slice(i, i + batchSize).map(item => ({
                user_id: user.id,
                sv_word: item.sv,
                nl_word: item.nl,
                example_sentence: item.ex,
                level: item.level,
                source: "Seed Data"
            }))

            const { error } = await supabase.from('vocab_items').insert(batch)

            if (error) {
                console.error("Batch Insertion Error:", error)
                addLog(`Batch ${i} Error: ${error.message}`)
                toast.error(`Fout bij batch ${i}: ${error.message}`)
            } else {
                count += batch.length
                addLog(`Inserted batch ${i} (${batch.length} items)`)
            }
        }
        toast.success(`${count} nieuwe woordjes toegevoegd!`)
        addLog(`DONE. Total Added: ${count}`)
        checkStats() // Refresh stats
        setLoading(false)
    }

    const handleSeedGrammar = async () => {
        if (!confirm("Dit voegt grammatica onderwerpen toe. Doorgaan?")) return
        setLoading(true)
        addLog("Starting Grammar Seed...")
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        try { await ensureProfile(user) } catch (e) { setLoading(false); return }

        let topics = 0
        let exercises = 0

        for (const t of seedGrammar) {
            // Check if topic exists
            let topicId
            const { data: existing } = await supabase.from('grammar_topics').select('id').eq('title', t.title).single()
            if (existing) {
                topicId = existing.id
                addLog(`Topic exists: ${t.title}`)
            } else {
                const { data: newT, error } = await supabase.from('grammar_topics').insert({
                    user_id: user.id,
                    title: t.title,
                    theory_markdown: t.theory,
                    level: t.level,
                    source: "Seed Data"
                }).select().single()

                if (error) addLog(`Topic Error ${t.title}: ${error.message}`)
                if (newT) {
                    topicId = newT.id
                    topics++
                    addLog(`Created Topic: ${t.title}`)
                }
            }

            if (topicId) {
                const exs = t.exercises.map((ex: any) => ({
                    user_id: user.id,
                    topic_id: topicId,
                    type: ex.type,
                    question: ex.question,
                    choices: ex.choices || null,
                    answer: ex.answer,
                    explanation: ex.explanation
                }))

                // Fix: Ignore duplicates
                const { error } = await supabase.from('grammar_exercises').insert(exs, { ignoreDuplicates: true } as any)

                if (error) {
                    console.error("Grammar Exercises Error:", error)
                    addLog(`Exercises Error: ${error.message}`)
                    toast.error(`Fout bij exercises voor ${t.title}: ${error.message}`)
                } else {
                    exercises += exs.length
                    addLog(`Added exercises for ${t.title}`)
                }
            }
        }
        toast.success(`${topics} topics en ${exercises} oefeningen verwerkt!`)
        addLog(`DONE. Topics: ${topics}, Exercises: ${exercises}`)
        setLoading(false)
    }

    const handleSeedReading = async () => {
        if (!confirm("Dit voegt leesteksten toe. Doorgaan?")) return
        setLoading(true)
        addLog("Starting Reading Seed...")
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        try { await ensureProfile(user) } catch (e) { setLoading(false); return }

        let texts = 0
        for (const r of seedReading) {
            // Note: Reading texts insert might fail if title unique, but here we select single wrapped.
            // Simplified: try insert, if 409 assume it exists and fetch it.

            let newTextData

            // Try fetch existing first to be safe/clean or just ignoreDuplicates on insert (but insert returns null on ignore dupes if conflict)
            const { data: existing } = await supabase.from('reading_texts').select('id').eq('title', r.title).single()

            if (existing) {
                newTextData = existing
                addLog(`Text exists: ${r.title}`)
            } else {
                const { data: created, error: textError } = await supabase.from('reading_texts').insert({
                    user_id: user.id,
                    title: r.title,
                    text_content: r.content,
                    level: r.level,
                    source: r.source
                }).select().single()

                if (textError) {
                    // unexpected error
                    console.error("Text Insert Error:", textError)
                    addLog(`Text Insert Error: ${textError.message}`)
                }
                newTextData = created
            }


            if (newTextData) {
                if (!existing) texts++ // Only count if new
                const qs = r.questions.map((q: any) => ({
                    user_id: user.id,
                    reading_id: newTextData.id,
                    type: q.type,
                    question: q.question,
                    choices: q.choices || null,
                    answer: q.answer,
                    explanation: q.explanation
                }))
                // Fix: Ignore duplicates
                const { error: qError } = await supabase.from('reading_questions').insert(qs, { ignoreDuplicates: true } as any)
                if (qError) {
                    console.error("Reading Questions Error:", qError)
                    addLog(`Questions Error: ${qError.message}`)
                }
                else addLog(`Added questions for ${r.title}`)
            }
        }
        if (texts > 0) toast.success(`${texts} nieuwe teksten toegevoegd!`)
        else toast.warning("Geen teksten toegevoegd.")
        addLog(`DONE. New Texts: ${texts}`)
        setLoading(false)
    }

    const handleSeedPronunciation = async () => {
        if (!confirm("Dit voegt uitspraak oefeningen toe. Doorgaan?")) return
        setLoading(true)
        addLog("Starting Pronunciation Seed...")
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        try { await ensureProfile(user) } catch (e) { setLoading(false); return }

        let count = 0
        for (const p of seedPronunciation) {
            const { data: existing } = await supabase.from('pronunciation_items').select('id').eq('title', p.title).single()

            if (existing) {
                addLog(`Pronunciation exists: ${p.title}`)
            } else {
                const { error } = await supabase.from('pronunciation_items').insert({
                    user_id: user.id,
                    title: p.title,
                    sv_text: p.text, // Correct column name!
                    notes: p.notes,
                    ipa: p.ipa,
                    level: p.level,
                    source: "Seed Data"
                })

                if (error) {
                    addLog(`Pronunciation Error: ${error.message}`)
                    console.error(error)
                } else {
                    count++
                    addLog(`Added: ${p.title}`)
                }
            }
        }
        toast.success(`${count} uitspraak oefeningen toegevoegd!`)
        addLog(`DONE. New Pronunciation Items: ${count}`)
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary flex items-center"><Database className="mr-2" /> Database Seeder</h1>
            <p className="text-muted-foreground">Admin tool om snel content te genereren.</p>

            {/* Diagnostics Panel */}
            <Card className="bg-slate-900 border-slate-800 text-slate-200">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-mono uppercase text-muted-foreground">Diagnostics</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex gap-4 text-sm font-mono">
                        <div>User ID: <span className="text-green-400">{stats.userId || 'Checking...'}</span></div>
                        <div>Vocab Count: <span className="text-blue-400">{stats.vocabCount}</span></div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader><CardTitle className="flex items-center"><Zap className="mr-2 h-5 w-5 text-yellow-500" /> Woordjes</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm">Voeg 500 veelgebruikte Zweedse woorden toe.</p>
                        <Button onClick={handleSeedVocab} disabled={loading} className="w-full">Seed Vocab (500)</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5 text-blue-500" /> Grammatica</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm">Voeg 5 topics en 50 oefeningen toe.</p>
                        <Button onClick={handleSeedGrammar} disabled={loading} className="w-full">Seed Grammar</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-green-500" /> Lezen</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm">Voeg 25 leesteksten met vragen toe.</p>
                        <Button onClick={handleSeedReading} disabled={loading} className="w-full">Seed Reading</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center"><Mic className="mr-2 h-5 w-5 text-purple-500" /> Uitspraak</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm">Voeg 7 tongbrekers en zinnen toe.</p>
                        <Button onClick={handleSeedPronunciation} disabled={loading} className="w-full">Seed Pronunciation</Button>
                    </CardContent>
                </Card>
            </div>

            {/* Log Console */}
            <Card className="bg-black text-green-500 font-mono text-xs h-64 overflow-y-auto">
                <CardContent className="pt-4 space-y-1">
                    {logs.length === 0 && <span className="text-slate-500">System Ready. Logs will appear here...</span>}
                    {logs.map((L, i) => <div key={i}>{L}</div>)}
                </CardContent>
            </Card>
        </div>
    )
}
