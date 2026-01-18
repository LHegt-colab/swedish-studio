"use client"
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'

// VOCAB FIELDS from previous implementation
const VOCAB_FIELDS = [
    { id: 'sv_word', label: 'Zweeds (Verplicht)' },
    { id: 'nl_word', label: 'Nederlands (Verplicht)' },
    { id: 'example_sentence', label: 'Voorbeeldzin' },
    { id: 'part_of_speech', label: 'Woordsoort' },
    { id: 'level', label: 'Niveau' },
    { id: 'source', label: 'Bron' }
]

export default function ImportPage() {
    const [mode, setMode] = useState<'vocab' | 'grammar' | 'reading'>('vocab')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [wb, setWb] = useState<XLSX.WorkBook | null>(null)

    // Vocab State
    const [vocabData, setVocabData] = useState<any[]>([])
    const [vocabHeaders, setVocabHeaders] = useState<string[]>([])
    const [vocabMapping, setVocabMapping] = useState<Record<string, string>>({})

    const supabase = createClient()

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)

        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result
            if (!bstr) return
            const workbook = XLSX.read(bstr, { type: 'binary' })
            setWb(workbook)

            // Parse First Sheet for Vocab Preview immediately (default)
            const wsname = workbook.SheetNames[0]
            const ws = workbook.Sheets[wsname]
            const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 })
            if (jsonData.length > 0) {
                const hdrs = jsonData[0] as string[]
                setVocabHeaders(hdrs)
                setVocabData(jsonData.slice(1))
                // Simple auto-map
                const initialMap: Record<string, string> = {}
                hdrs.forEach((h, idx) => {
                    const lower = String(h).toLowerCase()
                    if (lower.includes('sv')) initialMap[idx] = 'sv_word'
                    else if (lower.includes('nl')) initialMap[idx] = 'nl_word'
                })
                setVocabMapping(initialMap)
            }
        }
        reader.readAsBinaryString(f)
    }

    async function handleImportVocab() {
        if (!wb) return
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const rowsToInsert = vocabData.map((row: any) => {
            const item: any = { user_id: user.id }
            let hasData = false
            Object.entries(vocabMapping).forEach(([colIdx, field]) => {
                if (field) {
                    const val = row[Number(colIdx)]
                    if (val !== undefined) {
                        item[field] = String(val)
                        hasData = true
                    }
                }
            })
            if (!item.sv_word || !item.nl_word) return null
            return item
        }).filter(Boolean)

        if (rowsToInsert.length === 0) {
            toast.error("Geen geldige rijen")
            setLoading(false)
            return
        }

        const { error } = await supabase.from('vocab_items').insert(rowsToInsert)
        if (error) toast.error(error.message)
        else {
            toast.success(`${rowsToInsert.length} woordjes geïmporteerd!`)
            setFile(null); setWb(null); setVocabData([])
        }
        setLoading(false)
    }

    async function handleImportGrammar() {
        if (!wb) return
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Look for 'Grammar Topics' sheet
        const topicSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('topic'))
        const exerciseSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('exercise'))

        if (!topicSheetName) {
            toast.error("Geen 'Grammar Topics' blad gevonden")
            setLoading(false)
            return
        }

        // Process Topics
        const topicWs = wb.Sheets[topicSheetName]
        const topicData = XLSX.utils.sheet_to_json(topicWs)
        let createdTopics = 0
        let createdExercises = 0

        const topicTitleToId: Record<string, string> = {}
        const { data: existingTopics } = await supabase.from('grammar_topics').select('id, title')
        existingTopics?.forEach(t => topicTitleToId[t.title.toLowerCase().trim()] = t.id)

        for (const row of topicData as any[]) {
            const title = row['Title'] || row['title']
            if (!title) continue

            const normalizedTitle = title.trim()
            let tid = topicTitleToId[normalizedTitle.toLowerCase()]

            if (!tid) {
                const { data: newTopic } = await supabase.from('grammar_topics').insert({
                    user_id: user.id,
                    title: normalizedTitle,
                    theory_markdown: row['Theory'] || row['theory'] || '',
                    source: row['Source'] || row['source'],
                    level: row['Level'] || row['level']
                }).select().single()

                if (newTopic) {
                    tid = newTopic.id
                    topicTitleToId[normalizedTitle.toLowerCase()] = tid
                    createdTopics++
                }
            }
        }

        if (exerciseSheetName) {
            const exWs = wb.Sheets[exerciseSheetName]
            const exData = XLSX.utils.sheet_to_json(exWs)
            const exercisesToInsert: any[] = []

            for (const row of exData as any[]) {
                const tTitle = row['Topic'] || row['topic']
                if (!tTitle) continue
                const tid = topicTitleToId[tTitle.trim().toLowerCase()]
                if (!tid) continue

                const type = (row['Type'] || row['type'] || 'mcq').toLowerCase()
                const choicesRaw = row['Choices'] || row['choices']
                let choices = null
                if (choicesRaw && typeof choicesRaw === 'string') {
                    choices = choicesRaw.split('|').map(c => c.trim())
                }

                exercisesToInsert.push({
                    user_id: user.id,
                    topic_id: tid,
                    type: type === 'fill_in' ? 'fill_in' : 'mcq',
                    question: row['Question'] || row['question'],
                    answer: row['Answer'] || row['answer'],
                    explanation: row['Explanation'] || row['explanation'],
                    choices: choices
                })
            }
            if (exercisesToInsert.length > 0) {
                const { error } = await supabase.from('grammar_exercises').insert(exercisesToInsert)
                if (!error) createdExercises = exercisesToInsert.length
            }
        }
        toast.success(`Klaar! ${createdTopics} onderwerpen en ${createdExercises} grammatica-oefeningen.`)
        setFile(null); setWb(null); setLoading(false)
    }

    async function handleImportReading() {
        if (!wb) return
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const textsSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('text') || n.toLowerCase().includes('tekst'))
        const questionsSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('question') || n.toLowerCase().includes('vraag'))

        if (!textsSheetName) {
            toast.error("Geen 'Reading Texts' blad gevonden")
            setLoading(false)
            return
        }

        // Process Texts
        const textWs = wb.Sheets[textsSheetName]
        const textData = XLSX.utils.sheet_to_json(textWs)
        let createdTexts = 0
        let createdQuestions = 0

        const textTitleToId: Record<string, string> = {}
        const { data: existingTexts } = await supabase.from('reading_texts').select('id, title')
        existingTexts?.forEach(t => textTitleToId[t.title.toLowerCase().trim()] = t.id)

        for (const row of textData as any[]) {
            const title = row['Title'] || row['title']
            if (!title) continue

            const normalizedTitle = title.trim()
            let tid = textTitleToId[normalizedTitle.toLowerCase()]

            if (!tid) {
                const { data: newText } = await supabase.from('reading_texts').insert({
                    user_id: user.id,
                    title: normalizedTitle,
                    text_content: row['Content'] || row['content'] || '', // Renamed 'Text' to Content to avoid confusion
                    source: row['Source'] || row['source'],
                    level: row['Level'] || row['level']
                }).select().single()

                if (newText) {
                    tid = newText.id
                    textTitleToId[normalizedTitle.toLowerCase()] = tid
                    createdTexts++
                }
            }
        }

        // Process Questions
        if (questionsSheetName) {
            const qWs = wb.Sheets[questionsSheetName]
            const qData = XLSX.utils.sheet_to_json(qWs)
            const questionsToInsert: any[] = []

            for (const row of qData as any[]) {
                const tTitle = row['Text'] || row['text'] // Must match Text Title
                if (!tTitle) continue
                const tid = textTitleToId[tTitle.trim().toLowerCase()]
                if (!tid) continue

                const type = (row['Type'] || row['type'] || 'mcq').toLowerCase()
                const choicesRaw = row['Choices'] || row['choices']
                let choices = null
                if (choicesRaw && typeof choicesRaw === 'string') {
                    choices = choicesRaw.split('|').map(c => c.trim())
                }

                questionsToInsert.push({
                    user_id: user.id,
                    reading_id: tid,
                    type: type === 'open' ? 'open' : 'mcq',
                    question: row['Question'] || row['question'],
                    answer: row['Answer'] || row['answer'],
                    explanation: row['Explanation'] || row['explanation'],
                    choices: choices
                })
            }
            if (questionsToInsert.length > 0) {
                const { error } = await supabase.from('reading_questions').insert(questionsToInsert)
                if (!error) createdQuestions = questionsToInsert.length
            }
        }

        toast.success(`Klaar! ${createdTexts} teksten en ${createdQuestions} leesvragen.`)
        setFile(null); setWb(null); setLoading(false)
    }


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Importeren</h1>

            <Tabs value={mode} onValueChange={(v: any) => setMode(v)}>
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="vocab">Woordjes</TabsTrigger>
                    <TabsTrigger value="grammar">Grammatica</TabsTrigger>
                    <TabsTrigger value="reading">Lezen</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {mode === 'vocab' && 'Upload Woordjes Excel'}
                                {mode === 'grammar' && 'Upload Grammatica Excel'}
                                {mode === 'reading' && 'Upload Lezen Excel'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input type="file" accept=".xlsx, .xls" onChange={handleFile} />

                            {mode === 'grammar' && (
                                <div className="text-sm bg-muted p-4 rounded text-muted-foreground">
                                    <p className="font-bold mb-2">Vereiste Structuur:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Tab <strong>Grammar Topics</strong>: Title, Theory, Level, Source</li>
                                        <li>Tab <strong>Grammar Exercises</strong>: Topic, Type, Question, Answer, Choices, Explanation</li>
                                    </ul>
                                </div>
                            )}

                            {mode === 'reading' && (
                                <div className="text-sm bg-muted p-4 rounded text-muted-foreground">
                                    <p className="font-bold mb-2">Vereiste Structuur:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Tab <strong>Reading Texts</strong>: Title, Content, Level, Source</li>
                                        <li>Tab <strong>Reading Questions</strong>: Text (titel), Type, Question, Answer, Choices, Explanation</li>
                                    </ul>
                                </div>
                            )}

                            {mode === 'vocab' && vocabData.length > 0 && (
                                <div className="space-y-4 mt-6 border-t pt-4">
                                    <h3 className="font-semibold">Match Kolommen</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {vocabHeaders.map((h, i) => (
                                            <div key={i} className="flex flex-col gap-1">
                                                <span className="text-xs truncate font-bold" title={h}>{h}</span>
                                                <Select
                                                    value={vocabMapping[i] || ""}
                                                    onValueChange={v => setVocabMapping({ ...vocabMapping, [i]: v })}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                                                    <SelectContent>
                                                        {VOCAB_FIELDS.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={() => {
                                        if (mode === 'vocab') handleImportVocab()
                                        else if (mode === 'grammar') handleImportGrammar()
                                        else handleImportReading()
                                    }}
                                    disabled={loading || !file}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Start Import
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Tabs>
        </div>
    )
}
