export interface News {
    id: string
    title: string
    summary: string
    content?: string
    original_url?: string
    image_url?: string
    audio_url?: string
    relevance_score: number
    created_at: string
}

export interface Folder {
    id: string
    name: string
    user_id: string
    created_at: string
}

export interface SavedNews {
    id: string
    news_id: string
    folder_id?: string
    user_id: string
    created_at: string
    news?: News // For joined queries
}
