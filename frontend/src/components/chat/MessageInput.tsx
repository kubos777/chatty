import { useState } from 'react'

interface MessageInputProps {
    onSendMessage: (message: string) => void
    onTyping: () => void
    disabled?: boolean
}

export const MessageInput = ({ onSendMessage, onTyping, disabled }: MessageInputProps) => {
    const [messageText, setMessageText] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (messageText.trim()) {
            onSendMessage(messageText.trim())
            setMessageText('')
        }
    }

    return (
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                <div className="flex-1">
                    <div className="relative">
                        <input
                            type="text"
                            value={messageText}
                            onChange={(e) => {
                                setMessageText(e.target.value)
                                onTyping()
                            }}
                            placeholder="Type a message..."
                            className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                            disabled={disabled}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            😊
                        </button>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={disabled || !messageText.trim()}
                    className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-105 disabled:transform-none shadow-lg disabled:shadow-none"
                >
                    <span className="text-xl">🚀</span>
                </button>
            </form>
        </div>
    )
}