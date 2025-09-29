// frontend/src/components/sidebar/OnlineUsersList.tsx
import { Avatar } from '../ui/Avatar'

interface OnlineUser {
    username: string
    status: string
}

interface OnlineUsersListProps {
    users: OnlineUser[]
    onStartDM?: (username: string) => void
}

export const OnlineUsersList = ({ users, onStartDM }: OnlineUsersListProps) => {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">Online Now</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {users.length}
        </span>
            </div>

            <div className="space-y-3">
                {users.map((user) => (
                    <div key={user.username} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                        <Avatar name={user.username} status={user.status} size="md" />

                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user.username}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.status}</p>
                        </div>

                        {onStartDM && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()  // Prevenir propagación
                                    onStartDM(user.username)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-600"
                                title="Start DM"
                                disabled={false}  // Agregar control de disabled si es necesario
                            >
                                💬
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}