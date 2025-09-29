import { useState } from 'react'
import type { Socket } from 'socket.io-client'
import { Sidebar } from '../sidebar/Sidebar'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface Message {
    id: string
    message: string
    username: string
    room_id: string
    timestamp: string
}

interface User {
    id: number
    username: string
    email: string
}

interface DM {
    id: number
    name: string
    type: string
    with_user: string
    with_user_id: number
    last_message?: string
    unread_count?: number
}

interface ChatLayoutProps {
    user: User | null
    messages: Message[]
    dms: DM[]  // ← Agregar
    currentRoom: { id: number, type: 'public' | 'dm' }  // ← Agregar
    onlineUsers: Array<{username: string, status: string}>
    typingUsers: string[]
    isConnected: boolean
    socket: Socket | null
    onLogout: () => void
    onCreateDM: (username: string) => void  // ← Agregar
    onSwitchRoom: (roomId: number, type: 'public' | 'dm') => void  // ← Agregar
}

export const ChatLayout = ({
                               user,
                               messages,
                               dms,
                               currentRoom,
                               onlineUsers,
                               typingUsers,
                               isConnected,
                               socket,
                               onLogout,
                               onCreateDM,
                               onSwitchRoom
                           }: ChatLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userStatus, setUserStatus] = useState('online')

    const changeStatus = (newStatus: string) => {
        if (socket) {
            socket.emit('update_status', { status: newStatus })
            setUserStatus(newStatus)
        }
    }

    const sendMessage = (message: string) => {
        if (socket) {
            if (currentRoom.type === 'dm') {
                socket.emit('send_dm', {
                    message,
                    room_id: currentRoom.id
                })
            } else {
                socket.emit('send_message', {
                    message,
                    room_id: currentRoom.id
                })
            }
        }
    }

    const handleTyping = () => {
        if (socket) {
            socket.emit('typing_start', { room_id: currentRoom.id })
        }
    }

    const handleSelectDM = (dm: DM) => {
        setSidebarOpen(false)
        onSwitchRoom(dm.id, 'dm')
    }

    return (
        <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex overflow-hidden">
            <Sidebar
                user={user}
                onlineUsers={onlineUsers}
                dms={dms}
                currentRoom={currentRoom}
                userStatus={userStatus}
                onStatusChange={changeStatus}
                onLogout={onLogout}
                onCreateDM={onCreateDM}
                onSelectDM={handleSelectDM}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <ChatHeader
                    roomName={currentRoom.type === 'dm'
                        ? dms.find(dm => dm.id === currentRoom.id)?.with_user || 'DM'
                        : 'General Chat'
                    }
                    roomType={currentRoom.type}
                    onlineCount={onlineUsers.length}
                    isConnected={isConnected}
                    onToggleSidebar={() => setSidebarOpen(true)}
                />

                <MessageList
                    messages={messages}
                    currentUser={user?.username}
                    typingUsers={typingUsers}
                />

                <MessageInput
                    onSendMessage={sendMessage}
                    onTyping={handleTyping}
                    disabled={!isConnected}
                />
            </div>

            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    )
}