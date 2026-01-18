"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Book, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { GrammarTopic } from "@/types/database"
import Link from 'next/link'

interface GrammarTopicManagerProps {
    initialTopics: GrammarTopic[]
}

export function GrammarTopicManager({ initialTopics }: GrammarTopicManagerProps) {
    const [topics, setTopics] = useState<GrammarTopic[]>(initialTopics)
    const [searchTerm, setSearchTerm] = useState("")
    const [newTopicTitle, setNewTopicTitle] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const filteredTopics = topics.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddTopic = async () => {
        if (!newTopicTitle.trim()) return

        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error("Je moet ingelogd zijn")
            setIsLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('grammar_topics')
            .insert({
                title: newTopicTitle,
                user_id: user.id,
                tags: []
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding topic:', error)
            toast.error("Kon onderwerp niet toevoegen")
        } else {
            console.log('Added topic:', data) // Debug
            setTopics([data, ...topics])
            setNewTopicTitle("")
            setIsDialogOpen(false)
            toast.success("Onderwerp toegevoegd!")
            router.refresh()
        }
        setIsLoading(false)
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation
        if (!confirm("Weet je zeker dat je dit onderwerp wilt verwijderen?")) return

        const { error } = await supabase
            .from('grammar_topics')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error("Kon onderwerp niet verwijderen")
        } else {
            setTopics(topics.filter(t => t.id !== id))
            toast.success("Onderwerp verwijderd")
            router.refresh()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Zoek onderwerp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nieuw Onderwerp
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nieuw Grammatica Onderwerp</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Titel</Label>
                                <Input
                                    value={newTopicTitle}
                                    onChange={(e) => setNewTopicTitle(e.target.value)}
                                    placeholder="bv. Werkwoorden Present"
                                />
                            </div>
                            <Button onClick={handleAddTopic} disabled={isLoading} className="w-full">
                                {isLoading ? "Bezig..." : "Toevoegen"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTopics.map((topic) => (
                    <Link key={topic.id} href={`/grammatica/${topic.id}`}>
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full border-l-4 border-l-primary/50 group relative">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <Book className="h-5 w-5 text-primary" />
                                        <CardTitle className="line-clamp-1">{topic.title}</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                        onClick={(e) => handleDelete(topic.id, e)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {topic.theory_markdown ? topic.theory_markdown.substring(0, 100) + "..." : "Nog geen theorie toegevoegd."}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {filteredTopics.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        Geen onderwerpen gevonden. Maak er een aan!
                    </div>
                )}
            </div>
        </div>
    )
}
