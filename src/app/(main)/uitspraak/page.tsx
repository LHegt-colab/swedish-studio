"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Mic, Plus, Trash2, Upload, Volume2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import { AudioPlayer } from '@/components/audio-player'

export default function PronunciationPage() {
    const [items, setItems] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    // Form
    const [title, setTitle] = useState("")
    const [text, setText] = useState("")
    const [notes, setNotes] = useState("")
    const [ipa, setIpa] = useState("")
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadItems()
    }, [])

    async function loadItems() {
        const { data } = await supabase.from('pronunciation_items').select('*').order('created_at', { ascending: false })
        setItems(data || [])
    }

    async function handleAdd() {
        if (!title || !text) return toast.error("Titel en tekst verplicht")
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let audioUrl = null
        let storageKey = null

        // Handle Audio Upload
        if (audioFile) {
            const ext = audioFile.name.split('.').pop()
            const filename = `${user.id}/${Date.now()}.${ext}`

            const { data, error } = await supabase.storage
                .from('pronunciation-audio')
                .upload(filename, audioFile)

            if (error) {
                console.error(error)
                toast.error("Audio upload mislukt, item wordt zonder audio opgeslagen.")
            } else {
                storageKey = data.path
                const { data: { publicUrl } } = supabase.storage.from('pronunciation-audio').getPublicUrl(storageKey)
                audioUrl = publicUrl
            }
        }

        const { data, error } = await supabase.from('pronunciation_items').insert({
            user_id: user.id,
            title,
            sv_text: text,
            notes,
            ipa,
            audio_reference_url: audioUrl,
            audio_reference_storage_key: storageKey
        }).select().single()

        if (error) toast.error(error.message)
        else {
            setItems([data, ...items])
            setIsOpen(false)
            resetForm()
            toast.success("Opgeslagen")
        }
        setLoading(false)
    }

    function resetForm() {
        setTitle(""); setText(""); setNotes(""); setIpa(""); setAudioFile(null)
    }

    async function handleDelete(id: string, storageKey: string | null) {
        if (!confirm("Verwijderen?")) return

        if (storageKey) {
            await supabase.storage.from('pronunciation-audio').remove([storageKey])
        }

        const { error } = await supabase.from('pronunciation_items').delete().eq('id', id)
        if (!error) {
            setItems(items.filter(i => i.id !== id))
            toast.success("Verwijderd")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-primary">Uitspraak</h1>
                    <Link href="/uitspraak/oefenen">
                        <Button variant="outline"><Mic className="mr-2 h-4 w-4" /> Start Oefening</Button>
                    </Link>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Nieuw Item</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Nieuw Uitspraak Item</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2"><Label>Titel</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Bijv. Lange klinkers" /></div>
                            <div className="space-y-2"><Label>Zweedse Tekst</Label><Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Tekst om te oefenen..." /></div>
                            <div className="space-y-2"><Label>IPA (Optioneel)</Label><Input value={ipa} onChange={e => setIpa(e.target.value)} placeholder="/.../" /></div>
                            <div className="space-y-2"><Label>Notities</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Let op de r..." /></div>
                            <div className="space-y-2">
                                <Label>Audio Referentie (Optioneel)</Label>
                                <Input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
                            </div>
                        </div>
                        <Button onClick={handleAdd} className="w-full" disabled={loading}>
                            {loading ? "Opslaan..." : "Opslaan"}
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map(item => (
                    <Card key={item.id} className="felx flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg line-clamp-1" title={item.title}>{item.title}</CardTitle>
                            {item.audio_reference_url && <Volume2 className="h-4 w-4 text-primary" />}
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="bg-muted p-3 rounded-md mb-2 font-medium text-lg text-foreground/90 leading-relaxed">
                                {item.sv_text}
                            </div>
                            {item.ipa && <div className="text-sm font-mono text-muted-foreground mb-2">IPA: [{item.ipa}]</div>}

                            {item.audio_reference_url && (
                                <div className="mt-4 pt-2 border-t">
                                    <div className="text-xs text-muted-foreground mb-1">Referentie:</div>
                                    <AudioPlayer src={item.audio_reference_url} />
                                </div>
                            )}

                            {item.notes && <div className="text-sm text-muted-foreground border-t pt-2 mt-2">{item.notes}</div>}
                        </CardContent>
                        <CardFooter className="justify-end bg-muted/20 py-2">
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.audio_reference_storage_key)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {items.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        Geen uitspraak oefeningen. Upload er een!
                    </div>
                )}
            </div>
        </div>
    )
}
