import { createClient } from '@/utils/supabase/server'
import { NoteForm } from "@/components/note-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function EditNotePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()
    const { data: note } = await supabase.from('notes').select('*').eq('id', params.id).single()

    if (!note) return <div className="p-8 text-center text-muted-foreground">Notitie niet gevonden of geen toegang.</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/notities">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-primary">Notitie Bewerken</h1>
            </div>
            <NoteForm note={note} />
        </div>
    )
}
