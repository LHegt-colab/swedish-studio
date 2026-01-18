"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Repeat } from "lucide-react"
import Link from "next/link"

interface NeedsReviewCardProps {
    count: number
}

export function NeedsReviewCard({ count }: NeedsReviewCardProps) {
    return (
        <Card className={count > 0 ? "border-primary" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Te Reviewen</CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{count} Items</div>
                <p className="text-xs text-muted-foreground mb-4">
                    Klaar voor herhaling middels Spaced Repetition.
                </p>
                <Link href="/woordjes/review">
                    <Button disabled={count === 0} size="sm" className="w-full">
                        Start Review
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}
