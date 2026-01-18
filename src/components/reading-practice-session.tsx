"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, BookOpen } from "lucide-react"
import { toast } from "sonner"
import type { ReadingText, ReadingQuestion } from "@/types/database"
import Link from 'next/link'
import confetti from 'canvas-confetti'

export function ReadingPracticeSession() {
    const [step, setStep] = useState<'select' | 'read' | 'quiz' | 'summary'>('select')
    const [texts, setTexts] = useState<ReadingText[]>([])
    const [selectedText, setSelectedText] = useState<ReadingText | null>(null)
    const [questions, setQuestions] = useState<ReadingQuestion[]>([])

    // Quiz State
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userAnswer, setUserAnswer] = useState("")
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
    const [score, setScore] = useState(0)
    const [sessionId, setSessionId] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        async function loadTexts() {
            const { data } = await supabase.from('reading_texts').select('*')
            if (data) setTexts(data)
        }
        loadTexts()
    }, [])

    const handleSelectText = async (text: ReadingText) => {
        // Fetch questions first to check if there are any
        const { data: qs } = await supabase
            .from('reading_questions')
            .select('*')
            .eq('reading_id', text.id)

        if (!qs || qs.length === 0) {
            toast.error("Deze tekst heeft nog geen vragen.")
            return
        }

        setSelectedText(text)
        setQuestions(qs.sort(() => Math.random() - 0.5))
        setStep('read')

        // Start Session
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: session } = await supabase
                .from('practice_sessions')
                .insert({
                    user_id: user.id,
                    mode: 'reading',
                    total_items: qs.length,
                    score: 0
                })
                .select()
                .single()
            if (session) setSessionId(session.id)
        }
    }

    const startQuiz = () => {
        setStep('quiz')
        setCurrentIndex(0)
        setScore(0)
        setFeedback(null)
        setUserAnswer("")
    }

    const handleCheck = async () => {
        const currentQ = questions[currentIndex]
        // Simple string match for now, could be improved with fuzziness for open questions
        const isCorrect = userAnswer.toLowerCase().trim() === currentQ.answer.toLowerCase().trim()

        setFeedback(isCorrect ? 'correct' : 'incorrect')
        if (isCorrect) {
            setScore(s => s + 1)
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } })
        }

        // Save Attempt
        if (sessionId) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('practice_attempts').insert({
                    session_id: sessionId,
                    user_id: user.id,
                    reading_question_id: currentQ.id,
                    item_type: 'reading',
                    is_correct: isCorrect,
                    user_answer: userAnswer
                })
            }
        }
    }

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
            if (score === questions.length) confetti()
            setStep('summary')
        }
    }


    // --- RENDER ---

    if (step === 'select') {
        return (
            <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/lezen">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Kies een Tekst</h1>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {texts.map(t => (
                        <Card key={t.id} className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-primary" onClick={() => handleSelectText(t)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    {t.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {t.text_content.substring(0, 100)}...
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                    {texts.length === 0 && <p className="text-muted-foreground">Nog geen teksten beschikbaar.</p>}
                </div>
            </div>
        )
    }

    if (step === 'read') {
        return (
            <div className="max-w-3xl mx-auto space-y-6 h-[calc(100vh-100px)] flex flex-col">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => setStep('select')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Terug
                    </Button>
                    <Button size="lg" onClick={startQuiz}>
                        Ik heb het gelezen, start vragen
                    </Button>
                </div>

                <Card className="flex-1 overflow-auto bg-card shadow-md">
                    <CardContent className="p-8 prose dark:prose-invert max-w-none">
                        <h1 className="text-center mb-8">{selectedText?.title}</h1>
                        <div className="whitespace-pre-wrap text-lg leading-relaxed font-serif">
                            {selectedText?.text_content}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (step === 'quiz') {
        const currentQ = questions[currentIndex]
        const progress = ((currentIndex) / questions.length) * 100

        return (
            <div className="max-w-2xl mx-auto space-y-8 py-6">
                {/* Quick Ref Toggle could go here */}

                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>

                <Card className="min-h-[400px] flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                            <span>Vraag {currentIndex + 1} / {questions.length}</span>
                            <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                                {currentQ.type}
                            </span>
                        </div>
                        <CardTitle className="text-2xl mt-4">{currentQ.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                        {!feedback ? (
                            <>
                                {currentQ.type === 'mcq' && Array.isArray(currentQ.choices) ? (
                                    <div className="grid gap-3">
                                        {(currentQ.choices as string[]).map((c, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setUserAnswer(c)}
                                                className={`
                                                    w-full text-left p-4 rounded-xl border-2 transition-all
                                                    ${userAnswer === c ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}
                                                `}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <Input
                                        value={userAnswer}
                                        onChange={e => setUserAnswer(e.target.value)}
                                        placeholder="Jouw antwoord..."
                                        className="text-lg p-6"
                                    />
                                )}
                            </>
                        ) : (
                            <div className={`p-6 rounded-xl border ${feedback === 'correct' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
                                <div className="flex items-center gap-2 text-xl font-bold mb-2">
                                    {feedback === 'correct' ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                                    {feedback === 'correct' ? 'Correct!' : 'Fout'}
                                </div>
                                {feedback === 'incorrect' && (
                                    <p>Antwoord: <strong>{currentQ.answer}</strong></p>
                                )}
                                {currentQ.explanation && <p className="mt-2 text-sm text-muted-foreground">Requires: {currentQ.explanation}</p>}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-muted/30 p-4 border-t">
                        {!feedback ? (
                            <Button className="w-full h-12" onClick={handleCheck} disabled={!userAnswer}>Controleer</Button>
                        ) : (
                            <Button className="w-full h-12" onClick={handleNext}>Volgende</Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Summary
    return (
        <div className="max-w-md mx-auto text-center space-y-6 py-10">
            <Card className="p-8">
                <h2 className="text-3xl font-bold mb-4">Gelezen! 📚</h2>
                <div className="text-5xl font-black text-primary mb-4">{score} / {questions.length}</div>
                <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => window.location.reload()}>Opnieuw</Button>
                    <Link href="/lezen"><Button>Klaar</Button></Link>
                </div>
            </Card>
        </div>
    )
}
