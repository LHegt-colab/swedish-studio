"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, AlertCircle } from "lucide-react"

interface AudioPlayerProps {
    src: string
    className?: string
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [error, setError] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Reset state when src changes
        setIsPlaying(false)
        setError(false)
        if (audioRef.current) {
            audioRef.current.load()
        }
    }, [src])

    const togglePlay = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(e => {
                console.error("Audio playback failed", e)
                setError(true)
            })
        }
        setIsPlaying(!isPlaying)
    }

    if (error) {
        return (
            <div className="text-destructive text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Audio fout
            </div>
        )
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <audio
                ref={audioRef}
                src={src}
                onEnded={() => setIsPlaying(false)}
                onError={() => setError(true)}
                className="hidden"
            />
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full shadow-sm"
                onClick={togglePlay}
            >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
        </div>
    )
}
