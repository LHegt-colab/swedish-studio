"use client"
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { toast } from 'sonner'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ImportVerbsPage() {
    const [text, setText] = useState("")
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<any[]>([])
    const supabase = createClient()

    const parseText = (input: string) => {
        const lines = input.trim().split('\n')
        const data = lines.map(line => {
            // Split by tab (Excel copy) or generic whitespace if tabs fail
            const items = line.split('\t').map(i => i.trim())
            // Fallback for space separated if user messed up, but tab is standard for excel copy
            if (items.length < 2) return null

            // Expected: Categorie, Infinitief, Presens, Preteritum, Perfekt, Futurum
            // Sometimes Translation is at the end? Assuming 6 columns based on screenshot

            return {
                group_name: items[0],
                infinitive: items[1],
                present: items[2],
                past: items[3],
                supine: items[4],
                future: items[5],
                translation: items[6] || null // Optional 7th column
            }
        }).filter(item => item && item.infinitive && item.group_name) // Basic validation
        return data
    }

    const handlePreview = () => {
        const data = parseText(text)
        if (data.length === 0) {
            toast.error("Kon geen geldige rijen vinden. Kopieer direct uit Excel.")
            return
        }
        setPreview(data)
    }

    const handleSave = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error("Niet ingelogd")
            setLoading(false)
            return
        }

        const dataToInsert = preview.map(p => ({
            ...p,
            user_id: user.id
        }))

        const { error } = await supabase.from('verb_conjugations').insert(dataToInsert)

        if (error) {
            console.error(error)
            toast.error("Fout bij opslaan: " + error.message)
        } else {
            toast.success(`${dataToInsert.length} werkwoorden toegevoegd!`)
            setText("")
            setPreview([])
        }
        setLoading(false)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/importeren" className="flex items-center text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Terug naar overzicht
            </Link>

            <h1 className="text-3xl font-bold text-primary">Importeer Werkwoorden</h1>
            <p className="text-muted-foreground">Kopieer de cellen in Excel (inclusief Categorie) en plak ze hieronder.</p>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>1. Plak Data</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-xs bg-muted p-2 rounded">
                            <strong>Verwachte Volgorde (6 kolommen):</strong><br />
                            Categorie | Infinitief | Presens | Preteritum | Perfekt | Futurum | (Vertaling)
                        </div>
                        <Textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Plak hier je Excel data..."
                            className="h-64 font-mono text-sm"
                        />
                        <Button onClick={handlePreview} className="w-full">
                            Verwerk Data
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>2. Preview</CardTitle></CardHeader>
                    <CardContent className="h-[400px] overflow-auto">
                        {preview.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                Nog geen data om te tonen
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm font-semibold text-green-500">{preview.length} werkwoorden gevonden</p>
                                <div className="space-y-2">
                                    {preview.map((item, i) => (
                                        <div key={i} className="text-xs border p-2 rounded grid grid-cols-3 gap-2">
                                            <div className="font-bold text-primary">{item.infinitive}</div>
                                            <div className="col-span-2 text-muted-foreground">
                                                {item.present}, {item.past}, {item.supine}<br />
                                                <span className="italic">{item.group_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {preview.length > 0 && (
                <div className="flex justify-end">
                    <Button size="lg" onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                        Opslaan in Database
                    </Button>
                </div>
            )}
        </div>
    )
}
