import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { format } from 'date-fns'

export default async function NotesPage() {
    const supabase = await createClient()
    const { data: notes } = await supabase.from('notes').select('*').order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Notities</h1>
                <Link href="/notities/nieuw">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nieuwe Notitie
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes?.map((note) => (
                    <Link key={note.id} href={`/notities/${note.id}`}>
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full border-l-4 border-l-primary/50">
                            <CardHeader>
                                <CardTitle className="truncate">{note.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 font-mono text-xs">
                                    {note.content?.substring(0, 100)}
                                </p>
                                {note.tags && note.tags.length > 0 && (
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                        {note.tags.map((tag: string) => (
                                            <span key={tag} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <span className="text-xs text-muted-foreground">{format(new Date(note.created_at), 'dd-MM-yyyy HH:mm')}</span>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
                {(!notes || notes.length === 0) && (
                    <p className="text-muted-foreground col-span-full text-center py-10">Geen notities gevonden. Maak er een aan!</p>
                )}
            </div>
        </div>
    )
}
