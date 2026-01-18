import { createClient } from '@/utils/supabase/server'
import { notFound } from "next/navigation"
import { GrammarEditor } from "@/components/grammar-editor"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function GrammarTopicPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch topic
    const { data: topic } = await supabase
        .from('grammar_topics')
        .select('*')
        .eq('id', id)
        .single()

    if (!topic) {
        notFound()
    }

    // Fetch exercises
    const { data: exercises } = await supabase
        .from('grammar_exercises')
        .select('*')
        .eq('topic_id', id)
        .order('created_at', { ascending: true })

    return (
        <div className="space-y-6">
            <GrammarEditor topic={topic} initialExercises={exercises || []} />
        </div>
    )
}
