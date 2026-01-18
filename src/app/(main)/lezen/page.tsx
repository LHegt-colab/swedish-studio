import { createClient } from '@/utils/supabase/server'
import { ReadingList } from "@/components/reading-list"

export default async function ReadingPage() {
    const supabase = await createClient()
    const { data: texts } = await supabase
        .from('reading_texts')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Lezen & Begrip</h1>
            </div>

            <ReadingList initialTexts={texts || []} />
        </div>
    )
}
