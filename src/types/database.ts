export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            grammar_topics: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    theory_markdown: string | null
                    tags: string[] | null
                    level: string | null
                    source: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    title: string
                    theory_markdown?: string | null
                    tags?: string[] | null
                    level?: string | null
                    source?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    theory_markdown?: string | null
                    tags?: string[] | null
                    level?: string | null
                    source?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            grammar_exercises: {
                Row: {
                    id: string
                    user_id: string
                    topic_id: string
                    type: 'mcq' | 'fill_in'
                    question: string
                    choices: Json | null
                    answer: string
                    explanation: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    topic_id: string
                    type: 'mcq' | 'fill_in'
                    question: string
                    choices?: Json | null
                    answer: string
                    explanation?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    topic_id?: string
                    type?: 'mcq' | 'fill_in'
                    question?: string
                    choices?: Json | null
                    answer?: string
                    explanation?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            reading_texts: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    text_content: string
                    level: string | null
                    source: string | null
                    tags: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    title: string
                    text_content: string
                    level?: string | null
                    source?: string | null
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    text_content?: string
                    level?: string | null
                    source?: string | null
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
            reading_questions: {
                Row: {
                    id: string
                    user_id: string
                    reading_id: string
                    type: 'mcq' | 'open'
                    question: string
                    choices: Json | null
                    answer: string
                    explanation: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    reading_id: string
                    type: 'mcq' | 'open'
                    question: string
                    choices?: Json | null
                    answer: string
                    explanation?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    reading_id?: string
                    type?: 'mcq' | 'open'
                    question?: string
                    choices?: Json | null
                    answer?: string
                    explanation?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            pronunciation_items: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    sv_text: string
                    notes: string | null
                    ipa: string | null
                    audio_reference_url: string | null
                    audio_reference_storage_key: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    title: string
                    text_sv: string
                    notes?: string | null
                    ipa?: string | null
                    audio_reference_url?: string | null
                    audio_reference_storage_key?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    text_sv?: string
                    notes?: string | null
                    ipa?: string | null
                    audio_reference_url?: string | null
                    audio_reference_storage_key?: string | null
                    created_at?: string
                }
            }
            pronunciation_recordings: {
                Row: {
                    id: string
                    user_id: string
                    item_id: string
                    recording_url: string
                    storage_key: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    item_id: string
                    recording_url: string
                    storage_key: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    item_id?: string
                    recording_url?: string
                    storage_key?: string
                    created_at?: string
                }
            }
            user_goals: {
                Row: {
                    id: string
                    user_id: string
                    goal_type: string
                    target_value: number
                    period: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    goal_type: string
                    target_value: number
                    period?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    goal_type?: string
                    target_value?: number
                    period?: string
                    created_at?: string
                }
            }
            vocab_items: {
                Row: {
                    id: string
                    user_id: string
                    sv_word: string
                    nl_word: string
                    example_sentence: string | null
                    part_of_speech: string | null
                    level: string | null
                    source: string | null
                    next_review: string | null
                    interval: number | null
                    ease_factor: number | null
                    repetitions: number | null
                    last_review: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    sv_word: string
                    nl_word: string
                    example_sentence?: string | null
                    part_of_speech?: string | null
                    level?: string | null
                    source?: string | null
                    next_review?: string | null
                    interval?: number | null
                    ease_factor?: number | null
                    repetitions?: number | null
                    last_review?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    sv_word?: string
                    nl_word?: string
                    example_sentence?: string | null
                    part_of_speech?: string | null
                    level?: string | null
                    source?: string | null
                    next_review?: string | null
                    interval?: number | null
                    ease_factor?: number | null
                    repetitions?: number | null
                    last_review?: string | null
                    created_at?: string
                }
            }
        }
    }
}

export type GrammarTopic = Database['public']['Tables']['grammar_topics']['Row']
export type GrammarExercise = Database['public']['Tables']['grammar_exercises']['Row']
export type ReadingText = Database['public']['Tables']['reading_texts']['Row']
export type ReadingQuestion = Database['public']['Tables']['reading_questions']['Row']
export type PronunciationItem = Database['public']['Tables']['pronunciation_items']['Row']
export type PronunciationRecording = Database['public']['Tables']['pronunciation_recordings']['Row']
export type UserGoal = Database['public']['Tables']['user_goals']['Row']
export type VocabItem = Database['public']['Tables']['vocab_items']['Row']
