"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame } from "lucide-react"

interface StreakCounterProps {
    streak: number
}

export function StreakCounter({ streak }: StreakCounterProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Huidige Streak</CardTitle>
                <Flame className={`h-4 w-4 ${streak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{streak} Dagen</div>
                <p className="text-xs text-muted-foreground">
                    Ga zo door!
                </p>
            </CardContent>
        </Card>
    )
}
