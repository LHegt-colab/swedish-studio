"use client"
import { VerbPracticeSession } from "@/components/verb-practice-session"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function VerbPracticePage() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/oefenen">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <h1 className="text-3xl font-bold text-primary">Werkwoorden Oefenen</h1>
            </div>

            <p className="text-muted-foreground max-w-2xl">
                Oefen de 5 vormen van de Zweedse werkwoorden. Je krijgt de infinitief (het hele werkwoord) en moet de andere vormen invullen.
                Vormen als 'har' (bij perfekt) en 'ska' (bij futurum) staan alvast voor je klaar, vul alleen het werkwoord in.
            </p>

            <VerbPracticeSession />
        </div>
    )
}
