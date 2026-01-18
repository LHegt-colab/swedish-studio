import { NoteForm } from "@/components/note-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewNotePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/notities">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-primary">Nieuwe Notitie</h1>
            </div>
            <NoteForm />
        </div>
    )
}
