"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Trash2, Plus, Check, X } from "lucide-react"
import Link from 'next/link'
import { toast } from "sonner"
import ReactMarkdown from 'react-markdown'
import type { GrammarTopic, GrammarExercise } from "@/types/database"

interface GrammarEditorProps {
    topic: GrammarTopic
    initialExercises: GrammarExercise[]
}

export function GrammarEditor({ topic, initialExercises }: GrammarEditorProps) {
    const [theory, setTheory] = useState(topic.theory_markdown || "")
    const [exercises, setExercises] = useState<GrammarExercise[]>(initialExercises)
    const [isSaving, setIsSaving] = useState(false)

    // New Exercise State
    const [newExerciseType, setNewExerciseType] = useState<'mcq' | 'fill_in'>('mcq')
    const [newQuestion, setNewQuestion] = useState("")
    const [newAnswer, setNewAnswer] = useState("") // For Fill-in: correct text. For MCQ: correct option key/text
    const [newMCQOptions, setNewMCQOptions] = useState<string[]>(["", "", ""]) // 3 default options
    const [newExerciseExplanation, setNewExerciseExplanation] = useState("")

    const supabase = createClient()
    const router = useRouter()

    const handleSaveTheory = async () => {
        setIsSaving(true)
        const { error } = await supabase
            .from('grammar_topics')
            .update({ theory_markdown: theory })
            .eq('id', topic.id)

        if (error) {
            toast.error("Kon theorie niet opslaan")
        } else {
            toast.success("Theorie opgeslagen")
            router.refresh()
        }
        setIsSaving(false)
    }

    const handleAddExercise = async () => {
        if (!newQuestion || !newAnswer) {
            toast.error("Vul vraag en antwoord in")
            return
        }

        let choicesPayload = null
        if (newExerciseType === 'mcq') {
            // Filter empty options
            const validOptions = newMCQOptions.filter(o => o.trim() !== "")
            if (validOptions.length < 2) {
                toast.error("Minimaal 2 opties nodig voor meerkeuze")
                return
            }
            if (!validOptions.includes(newAnswer)) {
                toast.error("Het antwoord moet een van de opties zijn")
                return
            }
            choicesPayload = validOptions
        }

        setIsSaving(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const { data, error } = await supabase
            .from('grammar_exercises')
            .insert({
                topic_id: topic.id,
                user_id: user.id,
                type: newExerciseType,
                question: newQuestion,
                answer: newAnswer,
                choices: choicesPayload,
                explanation: newExerciseExplanation
            })
            .select()
            .single()

        if (error) {
            console.error(error)
            toast.error("Kon oefening niet toevoegen")
        } else {
            setExercises([...exercises, data as GrammarExercise])
            // Reset form
            setNewQuestion("")
            setNewAnswer("")
            setNewExplanation("")
            setNewMCQOptions(["", "", ""])
            toast.success("Oefening toegevoegd")
        }
        setIsSaving(false)
    }

    const handleDeleteExercise = async (id: string) => {
        const { error } = await supabase.from('grammar_exercises').delete().eq('id', id)
        if (error) {
            toast.error("Kon niet verwijderen")
        } else {
            setExercises(exercises.filter(e => e.id !== id))
            toast.success("Verwijderd")
        }
    }

    // Helper to update MCQ option at index
    const updateOption = (index: number, value: string) => {
        const newOptions = [...newMCQOptions]
        newOptions[index] = value
        setNewMCQOptions(newOptions)
    }

    // Helper reset wrapper
    const setNewExplanation = (val: string) => setNewExerciseExplanation(val)


    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center gap-4">
                <Link href="/grammatica">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                    {topic.title}
                </h1>
            </div>

            <Tabs defaultValue="theory" className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="theory">Theorie</TabsTrigger>
                    <TabsTrigger value="exercises">Oefeningen ({exercises.length})</TabsTrigger>
                </TabsList>

                {/* THEORY TAB */}
                <TabsContent value="theory" className="flex-1 space-y-4 mt-4">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Grammatica Uitleg</CardTitle>
                            <Button onClick={handleSaveTheory} disabled={isSaving}>
                                <Save className="mr-2 h-4 w-4" /> Opslaan
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 flex gap-4 min-h-[500px]">
                            {/* Editor */}
                            <div className="flex-1 flex flex-col gap-2">
                                <Label>Markdown Editor</Label>
                                <Textarea
                                    value={theory}
                                    onChange={(e) => setTheory(e.target.value)}
                                    className="flex-1 font-mono text-sm resize-none"
                                    placeholder="# Titel\n\nUitleg hier..."
                                />
                            </div>
                            {/* Preview */}
                            <div className="flex-1 flex flex-col gap-2">
                                <Label>Preview</Label>
                                <div className="flex-1 border rounded-md p-4 prose dark:prose-invert overflow-auto max-h-[600px] bg-muted/30">
                                    <ReactMarkdown>{theory}</ReactMarkdown>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* EXERCISES TAB */}
                <TabsContent value="exercises" className="space-y-6 mt-4">
                    {/* Add New Exercise Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Nieuwe Oefening</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={newExerciseType} onValueChange={(v: any) => setNewExerciseType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mcq">Meerkeuze</SelectItem>
                                            <SelectItem value="fill_in">Invullen</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Vraag</Label>
                                    <Input
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        placeholder="bv. Wat is de verleden tijd van 'åka'?"
                                    />
                                </div>
                            </div>

                            {newExerciseType === 'mcq' && (
                                <div className="space-y-2">
                                    <Label>Opties (Selecteer de juiste met het rondje)</Label>
                                    <div className="space-y-2">
                                        {newMCQOptions.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="correct_answer"
                                                    checked={newAnswer === opt && opt !== ""}
                                                    onChange={() => setNewAnswer(opt)}
                                                    className="w-4 h-4"
                                                    disabled={!opt}
                                                />
                                                <Input
                                                    value={opt}
                                                    onChange={(e) => updateOption(i, e.target.value)}
                                                    placeholder={`Optie ${i + 1}`}
                                                />
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setNewMCQOptions([...newMCQOptions, ""])}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Optie toevoegen
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {newExerciseType === 'fill_in' && (
                                <div className="space-y-2">
                                    <Label>Correct Antwoord</Label>
                                    <Input
                                        value={newAnswer}
                                        onChange={(e) => setNewAnswer(e.target.value)}
                                        placeholder="Het juiste antwoord"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Uitleg (Optioneel)</Label>
                                <Input
                                    value={newExerciseExplanation}
                                    onChange={(e) => setNewExerciseExplanation(e.target.value)}
                                    placeholder="Extra toelichting bij het antwoord"
                                />
                            </div>

                            <Button onClick={handleAddExercise} disabled={isSaving}>
                                <Plus className="mr-2 h-4 w-4" /> Oefening Toevoegen
                            </Button>
                        </CardContent>
                    </Card>

                    {/* List Existing Exercises */}
                    <div className="grid gap-4">
                        {exercises.map((ex, i) => (
                            <Card key={ex.id} className="bg-card/50">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                                {ex.type === 'mcq' ? 'Meerkeuze' : 'Invullen'}
                                            </span>
                                        </div>
                                        <p className="font-medium">{ex.question}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Antwoord: <span className="font-mono text-foreground">{ex.answer}</span>
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => handleDeleteExercise(ex.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
