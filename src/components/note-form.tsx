"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { Trash2, Save } from 'lucide-react'

interface NoteFormProps {
    note?: {
        id: string
        title: string
        content: string
        tags: string[]
    }
}

export function NoteForm({ note }: NoteFormProps) {
    const [title, setTitle] = useState(note?.title || "")
    const [content, setContent] = useState(note?.content || "")
    const [tags, setTags] = useState(note?.tags?.join(", ") || "")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit() {
        if (!title) return toast.error("Titel is verplicht")

        setLoading(true)
        const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("Je bent niet ingelogd")
            return
        }

        const payload = {
            title,
            content,
            tags: tagsArray,
            user_id: user.id
        }

        let error
        if (note?.id) {
            const { error: e } = await supabase.from('notes').update(payload).eq('id', note.id)
            error = e
        } else {
            const { error: e } = await supabase.from('notes').insert(payload)
            error = e
        }

        if (error) {
            toast.error(error.message)
        } else {
            toast.success("Notitie opgeslagen")
            router.push("/notities")
            router.refresh()
        }
        setLoading(false)
    }

    async function handleDelete() {
        if (!note?.id) return
        if (!confirm("Zeker weten?")) return
        setLoading(true)

        const { error } = await supabase.from('notes').delete().eq('id', note.id)
        if (error) {
            toast.error(error.message)
            setLoading(false)
        } else {
            toast.success("Verwijderd")
            router.push("/notities")
            router.refresh()
        }
    }

    return (
        <div className="space-y-4 max-w-4xl mx-auto pb-10">
            <div className="flex justify-between items-center gap-4">
                <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Titel van notitie..."
                    className="text-lg font-bold h-12"
                />
                <div className="flex gap-2">
                    <Button onClick={handleSubmit} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" /> Opslaan
                    </Button>
                    {note?.id && (
                        <Button variant="destructive" size="icon" onClick={handleDelete} disabled={loading}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Tags (komma gescheiden)</Label>
                <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="bijv. grammatica, werkwoorden, hoofdstuk 1" />
            </div>

            <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit">Bewerken</TabsTrigger>
                    <TabsTrigger value="preview">Voorbeeld</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="space-y-2 mt-4">
                    <Textarea
                        className="min-h-[500px] font-mono text-base bg-card p-4 leading-relaxed"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="# Hier typen..."
                    />
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                    <div className="border rounded-md p-6 min-h-[500px] prose dark:prose-invert max-w-none bg-card">
                        <ReactMarkdown>{content || "*Geen inhoud*"}</ReactMarkdown>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
