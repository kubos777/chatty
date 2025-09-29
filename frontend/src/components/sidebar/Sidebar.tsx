// frontend/src/components/sidebar/Sidebar.tsx
import { UserProfile } from './UserProfile'
import { OnlineUsersList } from './OnlineUsersList'
import { DMsList } from './DMsList'

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

interface SidebarProps {
    user: User | null
    onlineUsers: Array<{username: string, status: string}>
    dms: DM[]
    currentRoom: { id: number, type: 'public' | 'dm' }
    userStatus: string
    onStatusChange: (status: string) => void
    onLogout: () => void
    onCreateDM: (username: string) => void
    onSelectDM: (dm: DM) => void
    isOpen: boolean
    onToggle: () => void
}

export const Sidebar = ({
                            user,
                            onlineUsers,
                            dms,
                            currentRoom,
                            userStatus,
                            onStatusChange,
                            onLogout,
                            onCreateDM,
                            onSelectDM,
                            isOpen,
                            onToggle
                        }: SidebarProps) => {
    return (
        <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 w-80 h-full bg-white/90 backdrop-blur-sm border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Chats</h2>
                        <button
                            onClick={onToggle}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            ✕
                        </button>
                    </div>

                    <UserProfile
                        user={user}
                        status={userStatus}
                        onStatusChange={onStatusChange}
                        onLogout={onLogout}
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <DMsList
                        dms={dms}
                        onSelectDM={onSelectDM}
                        onCreateDM={onCreateDM}
                        currentDM={currentRoom.type === 'dm' ? dms.find(dm => dm.id === currentRoom.id) : undefined}
                    />

                    <OnlineUsersList users={onlineUsers} onStartDM={onCreateDM} />
                </div>
            </div>
        </div>
    )
}