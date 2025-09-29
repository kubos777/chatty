export interface Message {
    id: string
    message: string
    username: string
    room_id: string
    timestamp: string
}

export interface Room {
    id: string
    name: string
    description?: string
}

export interface User {
    username: string
    isOnline: boolean
}