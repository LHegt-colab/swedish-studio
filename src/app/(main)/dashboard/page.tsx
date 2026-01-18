import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Book, BookOpen, Mic, FileText, Settings, Rocket } from "lucide-react"
import Link from "next/link"
import { StreakCounter } from "@/components/dashboard/streak-counter"
import { NeedsReviewCard } from "@/components/dashboard/needs-review-card"
import { WeeklyGoalWidget } from "@/components/dashboard/weekly-goal-widget"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Inloggen vereist</div>

    // 1. Calculate Streak (simplified: days with sessions)
    // Fetch last 30 days sessions
    const { data: sessions } = await supabase
        .from('practice_sessions')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

    // Logic for streak could be more robust, but here's a simple "days with activity"
    const uniqueDays = new Set(sessions?.map(s => s.created_at.split('T')[0]))
    const streak = uniqueDays.size // Naive count for now, simplified

    // 2. Needs Review Count
    // Logic: next_review is null (new) OR next_review <= now
    const now = new Date().toISOString()
    const { count: reviewCount } = await supabase
        .from('vocab_items')
        .select('*', { count: 'exact', head: true })
        .or(`next_review.is.null,next_review.lte.${now}`)

    // 3. Weekly Goal Progress
    // Get this week's reviews from attempts
    const startOfWeek = new Date()
    startOfWeek.setHours(0, 0, 0, 0)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // Monday

    const { count: weeklyReviews } = await supabase
        .from('practice_attempts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString())
        .eq('item_type', 'vocab')

    // Get Goal Target
    const { data: goal } = await supabase
        .from('user_goals')
        .select('*')
        .eq('goal_type', 'vocab_reviews')
        .single()

    const weekTarget = goal?.target_value || 50

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Välkommen, {user.user_metadata?.full_name?.split(' ')[0] || 'Student'}! 👋</h1>
                    <p className="text-muted-foreground">Klaar om wat Zweeds te leren vandaag?</p>
                </div>
            </div>

            {/* Widgets Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StreakCounter streak={streak} />
                <NeedsReviewCard count={reviewCount || 0} />
                <WeeklyGoalWidget current={weeklyReviews || 0} target={weekTarget} goalId={goal?.id} />

                {/* Stats Summary (Time Spent Placeholder) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tijd deze week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">~{Math.round((sessions?.length || 0) * 5)} min</div>
                        <p className="text-xs text-muted-foreground">Schatting o.b.v. sessies</p>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-bold mt-8 mb-4">Snelstart</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/notities">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Notities</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Bekijk je grammatica aantekeningen.</p></CardContent>
                    </Card>
                </Link>
                <Link href="/woordjes">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Book className="h-5 w-5 text-primary" /> Woordjes</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Beheer je vocabulaire.</p></CardContent>
                    </Card>
                </Link>
                <Link href="/grammatica">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Grammatica</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Oefen grammatica onderwerpen.</p></CardContent>
                    </Card>
                </Link>
                <Link href="/lezen">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Lezen</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Lees teksten en beantwoord vragen.</p></CardContent>
                    </Card>
                </Link>
                <Link href="/uitspraak">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5 text-primary" /> Uitspraak</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Oefen je uitspraak met audio.</p></CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
