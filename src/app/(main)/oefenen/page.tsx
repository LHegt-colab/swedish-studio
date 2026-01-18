"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PracticeSetupPage() {
    const [mode, setMode] = useState("choice")
    const [direction, setDirection] = useState("sv_nl")
    const router = useRouter()

    function handleStart() {
        router.push(`/oefenen/run?mode=${mode}&direction=${direction}`)
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-center text-primary">Oefenen</h1>
            <Card>
                <CardHeader><CardTitle>Instellingen voor oefensessie</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-base">Modus</Label>
                        <RadioGroup value={mode} onValueChange={setMode} className="grid gap-2">
                            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="choice" id="choice" />
                                <Label htmlFor="choice" className="cursor-pointer flex-1">Meerkeuze</Label>
                            </div>
                            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="type" id="type" />
                                <Label htmlFor="type" className="cursor-pointer flex-1">Typen</Label>
                            </div>
                            <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="mix" id="mix" />
                                <Label htmlFor="mix" className="cursor-pointer flex-1">Mix</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base">Richting</Label>
                        <Select value={direction} onValueChange={setDirection}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sv_nl">Zweeds → Nederlands</SelectItem>
                                <SelectItem value="nl_sv">Nederlands → Zweeds</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button className="w-full text-lg py-6" size="lg" onClick={handleStart}>
                        Start Oefening
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
