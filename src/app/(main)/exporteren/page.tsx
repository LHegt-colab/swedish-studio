"use client"
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ExportPage() {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    async function handleExport() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch all data
        const { data: vocab } = await supabase.from('vocab_items').select('*')
        const { data: notes } = await supabase.from('notes').select('*')
        const { data: sessions } = await supabase.from('practice_sessions').select('*, practice_attempts(*)')
        const { data: pronunciation } = await supabase.from('pronunciation_items').select('*')

        // Fetch Grammar Data
        const { data: grammar_topics } = await supabase.from('grammar_topics').select('*')
        const { data: grammar_exercises } = await supabase.from('grammar_exercises').select('*')

        // Fetch Reading Data
        const { data: reading_texts } = await supabase.from('reading_texts').select('*')
        const { data: reading_questions } = await supabase.from('reading_questions').select('*')

        // Fetch Pronunciation Recordings
        const { data: recordings } = await supabase.from('pronunciation_recordings').select('*')

        const exportData = {
            user_id: user.id,
            exported_at: new Date().toISOString(),
            vocab: vocab || [],
            notes: notes || [],
            practice_sessions: sessions || [],
            pronunciation: pronunciation || [],
            pronunciation_recordings: recordings || [],
            grammar_topics: grammar_topics || [],
            grammar_exercises: grammar_exercises || [],
            reading_texts: reading_texts || [],
            reading_questions: reading_questions || []
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `swedish-studio-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success("Download gestart!")
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Exporteren</h1>
            <div className="bg-card p-6 rounded-md shadow max-w-xl border border-border">
                <h2 className="text-xl font-semibold mb-2">Backup Maken</h2>
                <p className="mb-6 text-muted-foreground">Download al je gegevens (woordjes, notities, oefensessies, uitspraak, grammatica) als een JSON-bestand.</p>
                <Button onClick={handleExport} disabled={loading} size="lg" className="w-full sm:w-auto">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                    Download Alle Gegevens
                </Button>
            </div>
        </div>
    )
}
