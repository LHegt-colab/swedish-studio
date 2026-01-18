"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleLogin() {
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast.error("Inloggen mislukt: " + error.message)
            setLoading(false)
        } else {
            toast.success("Succesvol ingelogd!")
            router.push("/dashboard")
            router.refresh()
        }
    }

    async function handleSignUp() {
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        })
        if (error) {
            toast.error("Registratie mislukt: " + error.message)
        } else {
            toast.success("Check je email voor de bevestigingslink!")
        }
        setLoading(false)
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/20 p-4">
            <Card className="w-full max-w-sm shadow-lg border-primary/10">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="font-bold text-xl">S</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center text-primary">Swedish Studio</CardTitle>
                    <CardDescription className="text-center">
                        Start vandaag met Zweeds leren.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="naam@voorbeeld.nl" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Wachtwoord</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" onClick={handleLogin} disabled={loading}>
                        {loading ? "Bezig..." : "Inloggen"}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleSignUp} disabled={loading}>
                        Nieuw account maken
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
