interface TypingIndicatorProps {
    users: string[]
}

export const TypingIndicator = ({ users }: TypingIndicatorProps) => {
    if (users.length === 0) return null

    return (
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                <p className="text-sm text-gray-600 italic">
                    {users.join(', ')} {users.length === 1 ? 'is' : 'are'} typing...
                </p>
            </div>
        </div>
    )
}