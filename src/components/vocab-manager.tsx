"use client"
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function VocabManager({ initialData }: { initialData: any[] }) {
    const [items, setItems] = useState(initialData || [])
    const [search, setSearch] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form state
    const [sv, setSv] = useState("")
    const [nl, setNl] = useState("")
    const [example, setExample] = useState("")

    const supabase = createClient()

    const filtered = items.filter(i =>
        i.sv_word.toLowerCase().includes(search.toLowerCase()) ||
        i.nl_word.toLowerCase().includes(search.toLowerCase())
    )

    async function handleAdd() {
        if (!sv || !nl) return toast.error("Zweeds en Nederlands zijn verplicht")

        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase.from('vocab_items').insert({
            sv_word: sv,
            nl_word: nl,
            example_sentence: example,
            user_id: user.id
        }).select().single()

        if (error) {
            toast.error(error.message)
        } else {
            toast.success("Woord toegevoegd")
            setItems([data, ...items])
            setIsOpen(false)
            setSv(""); setNl(""); setExample("")
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm("Woord verwijderen?")) return
        const { error } = await supabase.from('vocab_items').delete().eq('id', id)
        if (error) {
            toast.error(error.message)
        } else {
            setItems(items.filter(i => i.id !== id))
            toast.success("Verwijderd")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Zoek woordjes..."
                        className="pl-8"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Nieuw Woord</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Nieuw Woord toevoegen</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Zweeds</Label>
                                <Input value={sv} onChange={e => setSv(e.target.value)} placeholder="Svenska" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nederlands</Label>
                                <Input value={nl} onChange={e => setNl(e.target.value)} placeholder="Nederlands" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Voorbeeldzin (Optioneel)</Label>
                                <Input value={example} onChange={e => setExample(e.target.value)} placeholder="Zweedse zin..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={loading}>Opslaan</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Zweeds</TableHead>
                            <TableHead>Nederlands</TableHead>
                            <TableHead className="hidden md:table-cell">Voorbeeld</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-semibold text-primary">{item.sv_word}</TableCell>
                                <TableCell>{item.nl_word}</TableCell>
                                <TableCell className="text-muted-foreground italic hidden md:table-cell">{item.example_sentence}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive opacity-50 hover:opacity-100" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Geen woordjes gevonden.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground text-center">
                Totaal: {filtered.length} woordjes
            </div>
        </div>
    )
}
