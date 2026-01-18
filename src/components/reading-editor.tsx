"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Save, Trash2, Plus, BookOpen, Highlighter } from "lucide-react"
import Link from 'next/link'
import { toast } from "sonner"
import type { ReadingText, ReadingQuestion } from "@/types/database"

interface ReadingEditorProps {
    text: ReadingText
    initialQuestions: ReadingQuestion[]
}

export function ReadingEditor({ text, initialQuestions }: ReadingEditorProps) {
    // Text State
    const [title, setTitle] = useState(text.title)
    const [content, setContent] = useState(text.text_content || "")
    const [level, setLevel] = useState(text.level || "")
    const [source, setSource] = useState(text.source || "")

    // Questions State
    const [questions, setQuestions] = useState<ReadingQuestion[]>(initialQuestions)

    // UI State
    const [isSaving, setIsSaving] = useState(false)
    const [selection, setSelection] = useState<string | null>(null)
    const [isVocabDialogOpen, setIsVocabDialogOpen] = useState(false)

    // New Question form
    const [newQType, setNewQType] = useState<'mcq' | 'open'>('mcq')
    const [newQuestionStr, setNewQuestionStr] = useState("")
    const [newAnswer, setNewAnswer] = useState("")
    const [newMCQOptions, setNewMCQOptions] = useState<string[]>(["", "", ""])
    const [newExplanation, setNewExplanation] = useState("")

    // New Vocab Form
    const [newVocabSv, setNewVocabSv] = useState("")
    const [newVocabNl, setNewVocabNl] = useState("")

    const supabase = createClient()
    const router = useRouter()
    const contentRef = useRef<HTMLDivElement>(null)

    // --- TEXT UTILS ---

    const handleSaveText = async () => {
        setIsSaving(true)
        const { error } = await supabase
            .from('reading_texts')
            .update({
                title,
                text_content: content,
                level: level || null,
                source: source || null
            })
            .eq('id', text.id)

        if (error) {
            toast.error("Kon tekst niet opslaan")
        } else {
            toast.success("Opgeslagen")
            router.refresh()
        }
        setIsSaving(false)
    }

    const handleTextMouseUp = () => {
        const sel = window.getSelection()
        if (sel && sel.toString().trim().length > 0) {
            setSelection(sel.toString().trim())
        } else {
            // Only clear selection if we are not clicking the popover button (handled by blur usually, but keep simple)
            // setSelection(null) 
        }
    }

    const openAddVocab = () => {
        if (selection) {
            setNewVocabSv(selection)
            setNewVocabNl("") // reset
            setIsVocabDialogOpen(true)
        }
    }

    const handleSaveVocab = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !newVocabSv || !newVocabNl) return

        const { error } = await supabase.from('vocab_items').insert({
            user_id: user.id,
            sv_word: newVocabSv,
            nl_word: newVocabNl,
            source: title // Set source as this text title
        })

        if (error) {
            toast.error("Fout bij opslaan woordje")
        } else {
            toast.success("Woordje toegevoegd!")
            setIsVocabDialogOpen(false)
            setSelection(null)
            // Clear selection in browser
            window.getSelection()?.removeAllRanges()
        }
    }


    // --- QUESTION UTILS ---

    const handleAddQuestion = async () => {
        if (!newQuestionStr || !newAnswer) {
            toast.error("Vul vraag en antwoord in")
            return
        }

        let choicesPayload = null
        if (newQType === 'mcq') {
            const validOptions = newMCQOptions.filter(o => o.trim() !== "")
            if (validOptions.length < 2) {
                toast.error("Minimaal 2 opties")
                return
            }
            if (!validOptions.includes(newAnswer)) {
                toast.error("Antwoord moet een van de opties zijn")
                return
            }
            choicesPayload = validOptions
        }

        setIsSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('reading_questions')
            .insert({
                reading_id: text.id,
                user_id: user.id,
                type: newQType,
                question: newQuestionStr,
                answer: newAnswer,
                choices: choicesPayload,
                explanation: newExplanation
            })
            .select()
            .single()

        if (error) {
            toast.error("Fout bij toevoegen vraag")
        } else {
            setQuestions([...questions, data as ReadingQuestion])
            // Reset
            setNewQuestionStr("")
            setNewAnswer("")
            setNewExplanation("")
            setNewMCQOptions(["", "", ""])
            toast.success("Vraag toegevoegd")
        }
        setIsSaving(false)
    }

    const handleDeleteQuestion = async (id: string) => {
        const { error } = await supabase.from('reading_questions').delete().eq('id', id)
        if (!error) {
            setQuestions(questions.filter(q => q.id !== id))
            toast.success("Verwijderd")
        }
    }


    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Context Header */}
            <div className="flex items-center gap-4">
                <Link href="/lezen">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div className="flex-1">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                        placeholder="Titel van de tekst..."
                    />
                </div>
                <Button onClick={handleSaveText} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" /> Opslaan
                </Button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
                <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Niveau (bv A2)" />
                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Bron" className="col-span-3" />
            </div>

            <Tabs defaultValue="read" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                    <TabsTrigger value="read">Lezen & Bewerken</TabsTrigger>
                    <TabsTrigger value="questions">Vragen ({questions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="read" className="flex-1 min-h-0 flex gap-6">
                    {/* Left: Editor */}
                    <div className="flex-1 flex flex-col gap-2">
                        <Label>Inhoud Bewerken</Label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="flex-1 resize-none font-mono text-sm leading-relaxed"
                            placeholder="Plak hier de Zweedse tekst..."
                        />
                    </div>

                    {/* Right: Reader / Interaction */}
                    <div className="flex-1 flex flex-col gap-2">
                        <Label className="flex justify-between items-center">
                            <span>Leesmodus</span>
                            <span className="text-xs text-muted-foreground font-normal">Selecteer tekst om op te slaan als woordje</span>
                        </Label>
                        <div
                            className="flex-1 border rounded-md p-6 overflow-auto bg-card prose dark:prose-invert relative"
                            onMouseUp={handleTextMouseUp}
                            ref={contentRef}
                        >
                            <div className="whitespace-pre-wrap text-lg leading-loose font-serif text-foreground/90">
                                {content || <span className="text-muted-foreground italic">Begin met typen...</span>}
                            </div>

                            {/* Floating Action Button for Selection */}
                            {selection && (
                                <div className="absolute top-4 right-4 bg-popover shadow-lg border rounded-md p-3 animate-in fade-in slide-in-from-top-2 z-10 flex flex-col gap-2">
                                    <div className="text-xs font-semibold text-muted-foreground">Geselecteerd:</div>
                                    <div className="font-bold text-primary truncate max-w-[200px]">"{selection}"</div>
                                    <Button size="sm" onClick={openAddVocab} className="w-full">
                                        <BookOpen className="mr-2 h-3 w-3" /> Opslaan als Woordje
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setSelection(null); window.getSelection()?.removeAllRanges() }}>
                                        Annuleren
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="questions" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Nieuwe Vraag</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Select value={newQType} onValueChange={(v: any) => setNewQType(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mcq">Meerkeuze</SelectItem>
                                        <SelectItem value="open">Open Vraag</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input value={newQuestionStr} onChange={e => setNewQuestionStr(e.target.value)} placeholder="De vraag..." />
                            </div>

                            {newQType === 'mcq' && (
                                <div className="space-y-2 pl-4 border-l-2">
                                    <Label>Opties</Label>
                                    {newMCQOptions.map((opt, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <input type="radio" name="ans" checked={newAnswer === opt && opt !== ""} onChange={() => setNewAnswer(opt)} className="w-4 h-4" />
                                            <Input value={opt} onChange={e => {
                                                const n = [...newMCQOptions]; n[i] = e.target.value; setNewMCQOptions(n)
                                            }} placeholder={`Optie ${i + 1}`} />
                                        </div>
                                    ))}
                                    <Button size="sm" variant="outline" onClick={() => setNewMCQOptions([...newMCQOptions, ""])}>+ Optie</Button>
                                </div>
                            )}

                            {newQType === 'open' && (
                                <Input value={newAnswer} onChange={e => setNewAnswer(e.target.value)} placeholder="Het ideale antwoord" />
                            )}

                            <Input value={newExplanation} onChange={e => setNewExplanation(e.target.value)} placeholder="Uitleg (optioneel)" />

                            <Button onClick={handleAddQuestion} disabled={isSaving}>Toevoegen</Button>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        {questions.map(q => (
                            <Card key={q.id}>
                                <CardContent className="p-4 flex justify-between items-start">
                                    <div>
                                        <div className="flex gap-2 mb-1">
                                            <span className="text-xs bg-primary/10 text-primary px-1.5 rounded">{q.type}</span>
                                        </div>
                                        <p className="font-bold">{q.question}</p>
                                        <p className="text-sm text-muted-foreground mt-1">Antwoord: {q.answer}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteQuestion(q.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Vocab Dialog */}
            <Dialog open={isVocabDialogOpen} onOpenChange={setIsVocabDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Woordje Toevoegen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Zweeds</Label>
                            <Input value={newVocabSv} onChange={e => setNewVocabSv(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Nederlands</Label>
                            <Input value={newVocabNl} onChange={e => setNewVocabNl(e.target.value)} autoFocus placeholder="Vertaling..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Bron</Label>
                            <Input value={title} disabled className="bg-muted text-muted-foreground" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveVocab}>Opslaan in Woordjes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
