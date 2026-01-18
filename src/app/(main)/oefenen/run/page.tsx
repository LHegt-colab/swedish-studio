import { Suspense } from 'react'
import { PracticeSession } from "@/components/practice-session"

export default function PracticeRunPage() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center">Laden...</div>}>
            <PracticeSession />
        </Suspense>
    )
}
