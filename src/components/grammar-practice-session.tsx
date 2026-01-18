"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import type { GrammarTopic, GrammarExercise } from "@/types/database"
import Link from 'next/link'
import confetti from 'canvas-confetti'

export function GrammarPracticeSession() {
    const [step, setStep] = useState<'setup' | 'running' | 'summary'>('setup')
    const [topics, setTopics] = useState<GrammarTopic[]>([])
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])

    // Session State
    const [questions, setQuestions] = useState<GrammarExercise[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userAnswer, setUserAnswer] = useState("")
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
    const [score, setScore] = useState(0)
    const [sessionId, setSessionId] = useState<string | null>(null)

    const supabase = createClient()
    const router = useRouter()

    // 1. Fetch Topics on Mount
    useEffect(() => {
        async function fetchTopics() {
            const { data } = await supabase.from('grammar_topics').select('*')
            if (data) setTopics(data)
        }
        fetchTopics()
    }, [])

    // 2. Start Session (Fetch Questions)
    const handleStart = async () => {
        if (selectedTopics.length === 0) {
            toast.error("Selecteer minstens één onderwerp")
            return
        }

        const { data: exercises } = await supabase
            .from('grammar_exercises')
            .select('*')
            .in('topic_id', selectedTopics)

        if (!exercises || exercises.length === 0) {
            toast.error("Geen oefeningen gevonden voor deze onderwerpen")
            return
        }

        // Shuffle questions
        const shuffled = [...exercises].sort(() => Math.random() - 0.5)
        setQuestions(shuffled)
        setStep('running')
        setCurrentIndex(0)
        setScore(0)
        setFeedback(null)
        setUserAnswer("")

        // Create Session Record
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: session } = await supabase
                .from('practice_sessions')
                .insert({
                    user_id: user.id,
                    mode: 'grammar_mix', // Custom mode for grammar
                    total_items: shuffled.length,
                    score: 0
                })
                .select()
                .single()
            if (session) setSessionId(session.id)
        }
    }

    // 3. Check Answer
    const handleCheck = async () => {
        const currentQ = questions[currentIndex]
        const isCorrect = userAnswer.toLowerCase().trim() === currentQ.answer.toLowerCase().trim()

        setFeedback(isCorrect ? 'correct' : 'incorrect')
        if (isCorrect) {
            setScore(s => s + 1)
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
        }

        // Save Attempt
        if (sessionId) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('practice_attempts').insert({
                    session_id: sessionId,
                    user_id: user.id,
                    grammar_exercise_id: currentQ.id,
                    item_type: 'grammar',
                    is_correct: isCorrect,
                    user_answer: userAnswer
                })
            }
        }
    }

    // 4. Next Question
    const handleNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1)
            setUserAnswer("")
            setFeedback(null)
        } else {
            // Finish
            if (sessionId) {
                await supabase.from('practice_sessions').update({ score }).eq('id', sessionId)
            }
            if (score === questions.length) {
                confetti({ particleCount: 200, spread: 100 })
            }
            setStep('summary')
        }
    }

    // --- RENDER ---

    if (step === 'setup') {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/grammatica">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Grammatica Oefenen</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Selecteer Onderwerpen</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {topics.map(t => (
                            <div key={t.id} className="flex items-center space-x-2 border p-3 rounded hover:bg-muted/50">
                                <Checkbox
                                    id={t.id}
                                    checked={selectedTopics.includes(t.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) setSelectedTopics([...selectedTopics, t.id])
                                        else setSelectedTopics(selectedTopics.filter(id => id !== t.id))
                                    }}
                                />
                                <Label htmlFor={t.id} className="cursor-pointer flex-1 font-medium">
                                    {t.title}
                                </Label>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleStart} className="w-full" size="lg">Start Oefening</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (step === 'summary') {
        return (
            <div className="max-w-md mx-auto text-center space-y-6 py-10">
                <div className="bg-card border rounded-xl p-8 shadow-lg">
                    <h2 className="text-3xl font-bold mb-4">Sessie Voltooid! 🎉</h2>
                    <div className="text-6xl font-black text-primary mb-6">
                        {Math.round((score / questions.length) * 100)}%
                    </div>
                    <p className="text-muted-foreground mb-8">
                        Je had {score} van de {questions.length} vragen goed.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => window.location.reload()} variant="outline">
                            <RotateCcw className="mr-2 h-4 w-4" /> Opnieuw
                        </Button>
                        <Link href="/grammatica">
                            <Button>Terug naar Overzicht</Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // RUNNING
    const currentQ = questions[currentIndex]
    const progress = ((currentIndex) / questions.length) * 100

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-6">
            {/* Progress Bar */}
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <Card className="min-h-[400px] flex flex-col relative overflow-hidden border-2">
                <CardHeader>
                    <div className="flex justify-between text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                        <span>Vraag {currentIndex + 1} / {questions.length}</span>
                        <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                            {currentQ.type === 'mcq' ? 'Meerkeuze' : 'Invullen'}
                        </span>
                    </div>
                    <CardTitle className="text-2xl mt-4 leading-relaxed">
                        {currentQ.question}
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-center gap-6">
                    {/* INPUT AREA */}
                    {!feedback ? (
                        <div className="space-y-4">
                            {currentQ.type === 'mcq' && Array.isArray(currentQ.choices) ? (
                                <div className="grid gap-3">
                                    {(currentQ.choices as string[]).map((choice, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setUserAnswer(choice as string)}
                                            className={`
                                                w-full text-left p-4 rounded-xl border-2 transition-all
                                                ${userAnswer === choice
                                                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'}
                                            `}
                                        >
                                            <span className="font-bold mr-3 opacity-50">{String.fromCharCode(65 + i)}.</span>
                                            {choice}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <Input
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    placeholder="Type je antwoord..."
                                    className="text-lg p-6"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && userAnswer && handleCheck()}
                                />
                            )}
                        </div>
                    ) : (
                        /* FEEDBACK AREA */
                        <div className={`
                            p-6 rounded-xl border-l-4 animate-in fade-in slide-in-from-bottom-4 duration-300
                            ${feedback === 'correct' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}
                        `}>
                            <div className="flex items-center gap-3 mb-2">
                                {feedback === 'correct' ? (
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-600" />
                                )}
                                <span className={`font-bold text-lg ${feedback === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                                    {feedback === 'correct' ? 'Goed gedaan!' : 'Helaas, dat is niet goed.'}
                                </span>
                            </div>

                            {feedback === 'incorrect' && (
                                <div className="ml-9 text-foreground">
                                    Het juiste antwoord was: <span className="font-bold">{currentQ.answer}</span>
                                </div>
                            )}

                            {currentQ.explanation && (
                                <div className="ml-9 mt-4 text-sm text-muted-foreground bg-background/50 p-3 rounded">
                                    💡 <strong>Uitleg:</strong> {currentQ.explanation}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="bg-muted/30 p-4 border-t">
                    {!feedback ? (
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={handleCheck}
                            disabled={!userAnswer}
                        >
                            Controleren
                        </Button>
                    ) : (
                        <Button
                            className={`w-full h-12 text-lg ${feedback === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                            onClick={handleNext}
                        >
                            {currentIndex < questions.length - 1 ? 'Volgende Vraag' : 'Afronden'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
