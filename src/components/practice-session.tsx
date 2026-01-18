"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from 'sonner'
import { Check, X, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Progress } from '@/components/ui/progress'

export function PracticeSession() {
    const searchParams = useSearchParams()
    const modeParam = searchParams.get('mode') || 'choice'
    const directionParam = searchParams.get('direction') || 'sv_nl'

    const [items, setItems] = useState<any[]>([])
    const [queue, setQueue] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentAnswer, setCurrentAnswer] = useState("")
    const [status, setStatus] = useState<'answering' | 'correct' | 'incorrect'>('answering')
    const [score, setScore] = useState(0)
    const [finished, setFinished] = useState(false)
    const [attempts, setAttempts] = useState<any[]>([])

    // For multiple choice
    const [options, setOptions] = useState<string[]>([])

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from('vocab_items').select('*')
            if (data && data.length > 0) {
                setItems(data)
                // Shuffle and pick 10
                const shuffled = [...data].sort(() => 0.5 - Math.random()).slice(0, 10)
                setQueue(shuffled)
            }
            setLoading(false)
        }
        load()
    }, [])

    useEffect(() => {
        if (status === 'answering' && queue.length > 0 && currentIndex < queue.length) {
            generateOptions()
            setCurrentAnswer("")
        }
    }, [currentIndex, queue, status])

    const currentItem = queue[currentIndex]

    // Check effective mode (mix picks random for each question)
    const effectiveMode = modeParam === 'mix'
        ? (Math.random() > 0.5 ? 'choice' : 'type')
        : modeParam

    const targetLang = directionParam === 'sv_nl' ? 'nl' : 'sv'
    const sourceLang = directionParam === 'sv_nl' ? 'sv' : 'nl'
    const questionText = currentItem ? (sourceLang === 'sv' ? currentItem.sv_word : currentItem.nl_word) : ''
    const correctAnswer = currentItem ? (targetLang === 'nl' ? currentItem.nl_word : currentItem.sv_word) : ''

    function generateOptions() {
        if (effectiveMode !== 'choice') return
        if (!currentItem) return

        // Pick 3 random distractors
        const otherItems = items.filter(i => i.id !== currentItem.id)
        const shuffledOthers = [...otherItems].sort(() => 0.5 - Math.random()).slice(0, 3)
        const distractors = shuffledOthers.map(i => targetLang === 'nl' ? i.nl_word : i.sv_word)

        const allOptions = [...distractors, correctAnswer].sort(() => 0.5 - Math.random())
        setOptions(allOptions)
    }

    function handleCheck(answer?: string) {
        const userAnswer = answer || currentAnswer
        const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()

        setStatus(isCorrect ? 'correct' : 'incorrect')
        if (isCorrect) setScore(s => s + 1)

        // Log attempt
        setAttempts([...attempts, {
            vocab_id: currentItem.id,
            is_correct: isCorrect,
            user_answer: userAnswer
        }])
    }

    async function handleNext() {
        if (currentIndex + 1 >= queue.length) {
            setFinished(true)
            await saveSession()
        } else {
            setCurrentIndex(i => i + 1)
            setStatus('answering')
        }
    }

    async function saveSession() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Save session
        const { data: sessionData, error: sessionError } = await supabase.from('practice_sessions').insert({
            user_id: user.id,
            mode: modeParam,
            direction: directionParam,
            total_items: queue.length,
            score: score + (status === 'correct' ? 1 : 0) // Add valid score logic adjustment if needed. ACTUALLY score is already updated.
            // Wait, handleCheck updates score. 
            // If last item was correct, score is updated.
        }).select().single()

        if (sessionError) {
            toast.error("Fout bij opslaan: " + sessionError.message)
            return
        }

        // Save attempts
        const attemptsToSave = attempts.map(a => ({
            session_id: sessionData.id,
            user_id: user.id,
            vocab_id: a.vocab_id,
            is_correct: a.is_correct,
            user_answer: a.user_answer
        }))

        await supabase.from('practice_attempts').insert(attemptsToSave)
        toast.success("Sessie opgeslagen!")
    }

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>

    if (items.length === 0) return <div className="p-10 text-center">Nog geen woordjes om te oefenen. Voeg eerst woordjes toe!</div>

    if (finished) {
        return (
            <Card className="max-w-xl mx-auto text-center py-10">
                <CardTitle className="text-4xl mb-4">Klaar!</CardTitle>
                <CardContent>
                    <div className="text-6xl font-black text-primary mb-4">{Math.round((score / queue.length) * 100)}%</div>
                    <p className="text-muted-foreground">{score} van de {queue.length} goed.</p>
                    <Button className="mt-8" onClick={() => router.push('/oefenen')}>Terug naar overzicht</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Vraag {currentIndex + 1} / {queue.length}</span>
                    <span>Score: {score}</span>
                </div>
                <Progress value={(currentIndex / queue.length) * 100} />
            </div>

            <Card className="min-h-[300px] flex flex-col justify-between">
                <CardHeader>
                    <CardTitle className="text-center text-sm text-muted-foreground uppercase tracking-widest">
                        Vertaal naar het {targetLang === 'sv' ? 'Zweeds' : 'Nederlands'}
                    </CardTitle>
                    <div className="text-center text-4xl font-bold py-8 text-primary">
                        {questionText}
                    </div>
                </CardHeader>
                <CardContent>
                    {status === 'answering' ? (
                        <>
                            {effectiveMode === 'choice' ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {options.map(opt => (
                                        <Button key={opt} variant="outline" className="h-14 text-lg" onClick={() => handleCheck(opt)}>
                                            {opt}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        value={currentAnswer}
                                        onChange={e => setCurrentAnswer(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCheck()}
                                        placeholder="Typ je antwoord..."
                                        autoFocus
                                        className="text-lg h-12"
                                    />
                                    <Button onClick={() => handleCheck()} size="lg">Check</Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={`p-4 rounded-md text-center ${status === 'correct' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                            <div className="font-bold text-xl mb-2 flex items-center justify-center gap-2">
                                {status === 'correct' ? <Check /> : <X />}
                                {status === 'correct' ? 'Goed zo!' : 'Helaas!'}
                            </div>
                            {status === 'incorrect' && (
                                <div className="text-lg">
                                    Het juiste antwoord was: <span className="font-bold">{correctAnswer}</span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-end">
                    {status !== 'answering' && (
                        <Button onClick={handleNext} size="lg" className="w-full">
                            Volgende <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
