export type AccessLevel = 'free' | 'early_access'

export interface Movie {
    id: string
    title: string
    description: string | null
    poster_url: string | null
    created_at: string
    genre: string | null
    is_completed: boolean | null
}

export interface Episode {
    id: string
    movie_id: string
    title: string | null
    episode_number: number
    access_level: AccessLevel | null
    free_released_at: string | null
    stream_path: string | null
    is_published: boolean | null
    created_at: string
}

export interface Profile {
    id: string
    email: string | null
    role: string | null
    created_at: string
    username: string | null
}

export interface Subscription {
    id: string
    user_id: string
    status: string | null
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    current_period_end: string | null
    updated_at: string | null
}

export interface WatchHistoryRow {
    id: string
    user_id: string
    movie_id: string
    last_ep: number
    total_ep: number | null
    updated_at: string | null
}

export interface Comment {
    id: string
    movie_id: string
    user_id: string | null
    content: string
    created_at: string
    updated_at: string | null
}

/** รายการ "ดูต่อจากที่ค้างไว้" ที่ใช้ร่วมกันทั้งหน้าแรกและหน้าดูวิดีโอ */
export interface ContinueWatchingItem {
    movieId: string
    movieTitle: string
    posterUrl: string
    lastEp: number
    totalEp: number
    updatedAt: number
}