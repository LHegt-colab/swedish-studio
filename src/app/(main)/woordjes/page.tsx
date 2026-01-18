import { createClient } from '@/utils/supabase/server'
import { VocabManager } from '@/components/vocab-manager'

export default async function VocabPage() {
    const supabase = await createClient()
    const { data: vocab } = await supabase.from('vocab_items').select('*').order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Woordenschat</h1>
            <VocabManager initialData={vocab || []} />
        </div>
    )
}
