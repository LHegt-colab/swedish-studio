"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target, Edit2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

interface WeeklyGoalWidgetProps {
    current: number
    target: number
    goalId?: string
}

export function WeeklyGoalWidget({ current, target, goalId }: WeeklyGoalWidgetProps) {
    const [isEditing, setIsEditing] = useState(!goalId)
    const [newTarget, setNewTarget] = useState(target || 50)
    const supabase = createClient()
    const progress = Math.min((current / (target || 1)) * 100, 100)

    const handleSaveGoal = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (goalId) {
            await supabase.from('user_goals').update({ target_value: newTarget }).eq('id', goalId)
        } else {
            await supabase.from('user_goals').insert({
                user_id: user.id,
                goal_type: 'vocab_reviews',
                target_value: newTarget,
                period: 'weekly'
            })
        }
        setIsEditing(false)
        toast.success("Doel opgeslagen!")
        window.location.reload() // Simple reload to refresh updated props
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Wekelijks Doel (Reviews)</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            value={newTarget}
                            onChange={e => setNewTarget(parseInt(e.target.value))}
                            className="w-20"
                        />
                        <Button size="sm" onClick={handleSaveGoal}>Opslaan</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="text-2xl font-bold">{current} / {target}</div>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-6 w-6 p-0">
                                <Edit2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            {progress >= 100 ? "Doel bereikt! 🎉" : `${target - current} te gaan deze week.`}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
