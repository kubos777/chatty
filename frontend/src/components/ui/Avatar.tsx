interface AvatarProps {
    name: string
    size?: 'sm' | 'md' | 'lg'
    status?: string
    className?: string
}

export const Avatar = ({ name, size = 'md', status, className = '' }: AvatarProps) => {
    const sizes = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'online': return 'bg-green-400'
            case 'away': return 'bg-yellow-400'
            case 'busy': return 'bg-red-400'
            default: return 'bg-gray-400'
        }
    }

    return (
        <div className={`relative ${className}`}>
            <div className={`${sizes[size]} bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center`}>
                <span className="text-white font-semibold">{name[0]?.toUpperCase()}</span>
            </div>
            {status && (
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(status)} rounded-full border-2 border-white`}></div>
            )}
        </div>
    )
}