import { createClient } from '@/utils/supabase/server'
import { notFound } from "next/navigation"
import { ReadingEditor } from "@/components/reading-editor"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ReadingDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch text
    const { data: text } = await supabase
        .from('reading_texts')
        .select('*')
        .eq('id', id)
        .single()

    if (!text) {
        notFound()
    }

    // Fetch questions
    const { data: questions } = await supabase
        .from('reading_questions')
        .select('*')
        .eq('reading_id', id)
        .order('created_at', { ascending: true })

    return (
        <ReadingEditor text={text} initialQuestions={questions || []} />
    )
}
