"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, FileText, Trash2, BookOpen } from "lucide-react"
import { toast } from "sonner"
import type { ReadingText } from "@/types/database"
import Link from 'next/link'

interface ReadingListProps {
    initialTexts: ReadingText[]
}

export function ReadingList({ initialTexts }: ReadingListProps) {
    const [texts, setTexts] = useState<ReadingText[]>(initialTexts)
    const [searchTerm, setSearchTerm] = useState("")
    const [newTitle, setNewTitle] = useState("")
    const [newLevel, setNewLevel] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const filteredTexts = texts.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddText = async () => {
        if (!newTitle.trim()) {
            toast.error("Titel is verplicht")
            return
        }

        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error("Je moet ingelogd zijn")
            setIsLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('reading_texts')
            .insert({
                title: newTitle,
                user_id: user.id,
                level: newLevel || null,
                text_content: "", // Start empty
                tags: []
            })
            .select()
            .single()

        if (error) {
            console.error(error)
            toast.error("Kon tekst niet aanmaken")
        } else {
            setTexts([data, ...texts])
            setNewTitle("")
            setNewLevel("")
            setIsDialogOpen(false)
            toast.success("Tekst aangemaakt!")
            router.refresh()
            // Direct user to edit the new text
            router.push(`/lezen/${data.id}`)
        }
        setIsLoading(false)
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        if (!confirm("Weet je zeker dat je deze tekst wilt verwijderen?")) return

        const { error } = await supabase.from('reading_texts').delete().eq('id', id)
        if (error) {
            toast.error("Kon niet verwijderen")
        } else {
            setTexts(texts.filter(t => t.id !== id))
            toast.success("Verwijderd")
            router.refresh()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Zoek tekst..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nieuwe Tekst
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nieuwe Tekst Toevoegen</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Titel</Label>
                                <Input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="bv. En dag i Stockholm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Niveau (Optioneel)</Label>
                                <Input
                                    value={newLevel}
                                    onChange={(e) => setNewLevel(e.target.value)}
                                    placeholder="bv. A2"
                                />
                            </div>
                            <Button onClick={handleAddText} disabled={isLoading} className="w-full">
                                {isLoading ? "Bezig..." : "Toevoegen"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTexts.map((text) => (
                    <Link key={text.id} href={`/lezen/${text.id}`}>
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full border-l-4 border-l-primary group">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <CardTitle className="line-clamp-1">{text.title}</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                        onClick={(e) => handleDelete(text.id, e)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    {text.level && <span className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">{text.level}</span>}
                                    <span className="text-xs">{new Date(text.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-3 italic">
                                    {text.text_content ? text.text_content.substring(0, 100) + "..." : "Nog lege tekst..."}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
