import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

interface Message {
    id: string
    message: string
    username: string
    room_id: string
    timestamp: string
}

interface MessageListProps {
    messages: Message[]
    currentUser?: string
    typingUsers: string[]
}

export const MessageList = ({ messages, currentUser, typingUsers }: MessageListProps) => {
    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">💬</span>
                    </div>
                    <p className="text-gray-500 font-medium">No messages yet</p>
                    <p className="text-gray-400 text-sm">Be the first to start the conversation!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => {
                const isOwn = message.username === currentUser
                const showAvatar = index === 0 || messages[index - 1]?.username !== message.username

                return (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                    />
                )
            })}

            {typingUsers.length > 0 && (
                <TypingIndicator users={typingUsers} />
            )}
        </div>
    )
}