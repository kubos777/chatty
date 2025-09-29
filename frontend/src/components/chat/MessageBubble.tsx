import { Avatar } from '../ui/Avatar'

interface Message {
    id: string
    message: string
    username: string
    room_id: string
    timestamp: string
}

interface MessageBubbleProps {
    message: Message
    isOwn: boolean
    showAvatar: boolean
}

export const MessageBubble = ({ message, isOwn, showAvatar }: MessageBubbleProps) => {
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)

        if (minutes < 1) return 'now'
        if (minutes < 60) return `${minutes}m`
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
        return date.toLocaleDateString()
    }

    return (
        <div className={`flex items-end space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {showAvatar ? (
                <Avatar name={message.username} size="sm" />
            ) : (
                <div className="w-8 h-8 flex-shrink-0" />
            )}

            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                isOwn
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
            }`}>
                {showAvatar && !isOwn && (
                    <p className="text-xs font-semibold text-blue-600 mb-1">{message.username}</p>
                )}
                <p className="text-sm leading-relaxed">{message.message}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                </p>
            </div>
        </div>
    )
}