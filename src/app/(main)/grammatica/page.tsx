import { createClient } from '@/utils/supabase/server'
import { GrammarTopicManager } from "@/components/grammar-topic-manager"

export default async function GrammarPage() {
    const supabase = await createClient()
    const { data: topics } = await supabase
        .from('grammar_topics')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Grammatica</h1>
            </div>

            <GrammarTopicManager initialTopics={topics || []} />
        </div>
    )
}
