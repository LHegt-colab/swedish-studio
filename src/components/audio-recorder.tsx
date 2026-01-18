"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, RotateCw } from "lucide-react"

interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob) => void
    isUploading?: boolean
}

export function AudioRecorder({ onRecordingComplete, isUploading }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            chunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)
                onRecordingComplete(blob)

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
        } catch (err) {
            console.error("Could not start recording", err)
            alert("Microfoon toegang nodig om te kunnen opnemen.")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const reset = () => {
        setAudioUrl(null)
    }

    if (audioUrl) {
        return (
            <div className="flex items-center gap-2">
                <audio src={audioUrl} controls className="h-8 w-48" />
                <Button variant="ghost" size="icon" onClick={reset} disabled={isUploading}>
                    <RotateCw className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <Button
            variant={isRecording ? "destructive" : "secondary"}
            size={isRecording ? "icon" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            className={`transition-all ${isRecording ? "animate-pulse" : ""}`}
            disabled={isUploading}
        >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4 mr-2" />}
            {isRecording ? "" : "Opnemen"}
        </Button>
    )
}
