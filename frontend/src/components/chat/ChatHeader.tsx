// frontend/src/components/chat/ChatHeader.tsx
interface ChatHeaderProps {
    roomName: string  // ← Cambiar de onlineCount a roomName
    roomType: 'public' | 'dm'  // ← Agregar
    onlineCount: number
    isConnected: boolean
    onToggleSidebar: () => void
}

export const ChatHeader = ({ roomName, roomType, onlineCount, isConnected, onToggleSidebar }: ChatHeaderProps) => {
    return (
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                    ☰
                </button>

                <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${roomType === 'dm' ? 'bg-gradient-to-r from-purple-400 to-pink-500' : 'bg-gradient-to-r from-green-400 to-blue-500'} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-semibold">{roomType === 'dm' ? '💬' : '#'}</span>
                    </div>
                    <div>
                        <h1 className="font-semibold text-gray-900">{roomName}</h1>
                        <p className="text-sm text-gray-500">
                            {roomType === 'dm' ? 'Direct Message' : `${onlineCount} members online`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                    isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Offline'}</span>
                </div>
            </div>
        </div>
    )
}