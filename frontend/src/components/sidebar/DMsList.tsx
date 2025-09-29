// components/sidebar/DMsList.tsx
import { useState } from 'react'
import { Avatar } from '../ui/Avatar'

interface DM {
    id: number
    name: string
    with_user: string
    last_message?: string
    unread_count?: number
}

interface DMsListProps {
    dms: DM[]
    onSelectDM: (dm: DM) => void
    onCreateDM: (username: string) => void
    currentDM?: DM
}

export const DMsList = ({ dms, onSelectDM, onCreateDM, currentDM }: DMsListProps) => {
    const [showNewDM, setShowNewDM] = useState(false)
    const [newDMUsername, setNewDMUsername] = useState('')

    const handleCreateDM = (e: React.FormEvent) => {
        e.preventDefault()
        if (newDMUsername.trim()) {
            onCreateDM(newDMUsername.trim())
            setNewDMUsername('')
            setShowNewDM(false)
        }
    }

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">Direct Messages</h3>
                <button
                    onClick={() => setShowNewDM(!showNewDM)}
                    className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-blue-600 transition-colors"
                >
                    +
                </button>
            </div>

            {showNewDM && (
                <form onSubmit={handleCreateDM} className="mb-3">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Username..."
                            value={newDMUsername}
                            onChange={(e) => setNewDMUsername(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                        >
                            Start
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {dms.map((dm) => (
                    <button
                        key={dm.id}
                        onClick={() => onSelectDM(dm)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors text-left ${
                            currentDM?.id === dm.id ? 'bg-blue-100 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                    >
                        <Avatar name={dm.with_user} size="sm" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{dm.with_user}</p>
                            {dm.last_message && (
                                <p className="text-xs text-gray-500 truncate">{dm.last_message}</p>
                            )}
                        </div>
                        {dm.unread_count && dm.unread_count > 0 && (
                            <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {dm.unread_count > 9 ? '9+' : dm.unread_count}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}