"use client"
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Copy, Download, Upload } from 'lucide-react'

export default function PacksPage() {
    const supabase = createClient()
    const [grammarTopics, setGrammarTopics] = useState<any[]>([])

    // Create Mode
    const [selectedTopicId, setSelectedTopicId] = useState<string>("")
    const [generatedPack, setGeneratedPack] = useState<string>("")

    // Import Mode
    const [importJson, setImportJson] = useState("")

    const loadTopics = async () => {
        const { data } = await supabase.from('grammar_topics').select('id, title')
        if (data) setGrammarTopics(data)
    }

    const handleCreatePack = async () => {
        if (!selectedTopicId) return toast.error("Kies een onderwerp")

        // Fetch Topic
        const { data: topic } = await supabase.from('grammar_topics').select('*').eq('id', selectedTopicId).single()
        // Fetch Exercises
        const { data: exercises } = await supabase.from('grammar_exercises').select('*').eq('topic_id', selectedTopicId)

        // (Optional: Could try to smart-find vocab mentioned in theory, but skipping for MVP complexity)

        const pack = {
            type: "swedish-studio-pack-v1",
            created_at: new Date().toISOString(),
            data: {
                grammar_topics: [topic],
                grammar_exercises: exercises
            }
        }

        setGeneratedPack(JSON.stringify(pack, null, 2))
        toast.success("Pack gegenereerd!")
    }

    const handleImportPack = async () => {
        try {
            const pack = JSON.parse(importJson)
            if (pack.type !== "swedish-studio-pack-v1") throw new Error("Ongeldig pack formaat")

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let importedTopics = 0

            // Import Grammar Topics
            for (const t of pack.data.grammar_topics || []) {
                // Check dupes
                const { data: existing } = await supabase.from('grammar_topics').select('id').eq('title', t.title).single()
                let topicId = existing?.id

                if (!topicId) {
                    const { data: newT } = await supabase.from('grammar_topics').insert({
                        user_id: user.id, // Reassign owner
                        title: t.title,
                        theory_markdown: t.theory_markdown,
                        level: t.level
                    }).select().single()
                    topicId = newT.id
                    importedTopics++
                }

                // Import Exercises for this topic
                const exercisesForTopic = pack.data.grammar_exercises?.filter((e: any) => e.topic_id === t.id) || []
                for (const ex of exercisesForTopic) {
                    await supabase.from('grammar_exercises').insert({
                        user_id: user.id,
                        topic_id: topicId, // Re-link to new/existing topic
                        type: ex.type,
                        question: ex.question,
                        answer: ex.answer,
                        choices: ex.choices,
                        explanation: ex.explanation
                    })
                }
            }

            toast.success(`Pack geïmporteerd! ${importedTopics} nieuwe onderwerpen.`)
            setImportJson("")

        } catch (e) {
            console.error(e)
            toast.error("Fout bij importeren pack. Check JSON.")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">Content Packs 📦</h1>
                <p className="text-muted-foreground">Deel je lesmateriaal met anderen.</p>
            </div>

            <Tabs defaultValue="create" className="max-w-3xl">
                <TabsList>
                    <TabsTrigger value="create">Maak Pack</TabsTrigger>
                    <TabsTrigger value="import">Importeer Pack</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Genereer Pack</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" onClick={loadTopics} className="mb-2">Laad Onderwerpen</Button>
                            {grammarTopics.length > 0 && (
                                <Select onValueChange={setSelectedTopicId}>
                                    <SelectTrigger><SelectValue placeholder="Kies Grammatica Topic" /></SelectTrigger>
                                    <SelectContent>
                                        {grammarTopics.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                            <Button onClick={handleCreatePack} disabled={!selectedTopicId}>Genereer JSON</Button>

                            {generatedPack && (
                                <div className="space-y-2">
                                    <Textarea value={generatedPack} readOnly className="font-mono text-xs h-64" />
                                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(generatedPack); toast.success("Gekopieerd") }}>
                                        <Copy className="mr-2 h-4 w-4" /> Kopieer
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="import">
                    <Card>
                        <CardHeader><CardTitle>Plak JSON Code</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder='{"type": "swedish-studio-pack-v1", ...}'
                                value={importJson}
                                onChange={e => setImportJson(e.target.value)}
                                className="font-mono text-sm h-64"
                            />
                            <Button onClick={handleImportPack} disabled={!importJson}>
                                <Upload className="mr-2 h-4 w-4" /> Importeer
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
