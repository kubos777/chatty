import { Avatar } from '../ui/Avatar.tsx'

interface User {
    id: number
    username: string
    email: string
}

interface UserProfileProps {
    user: User | null
    status: string
    onStatusChange: (status: string) => void
    onLogout: () => void
}

export const UserProfile = ({ user, status, onStatusChange, onLogout }: UserProfileProps) => {
    if (!user) return null

    return (
        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <Avatar name={user.username} status={status} size="md" />

            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.username}</p>
                <select
                    value={status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                    <option value="online">🟢 Online</option>
                    <option value="away">🟡 Away</option>
                    <option value="busy">🔴 Busy</option>
                </select>
            </div>

            <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
            >
                🚪
            </button>
        </div>
    )
}