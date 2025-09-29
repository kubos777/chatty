// App.tsx con DMs
import { useState } from 'react'
import { AuthLayout } from './components/auth/AuthLayout'
import { LoginForm } from './components/auth/LoginForm'
import { ChatLayout } from './components/chat/ChatLayout'
import { useSocket } from './hooks/useSocket'

interface User {
    id: number
    username: string
    email: string
}

function App() {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
    const {
        socket,
        messages,
        dms,
        currentRoom,
        onlineUsers,
        typingUsers,
        isConnected,
        isAuthenticated,
        user,
        createDM,
        switchToRoom
    } = useSocket(token)

    const handleLogin = (accessToken: string, userData: User) => {
        localStorage.setItem('token', accessToken)
        setToken(accessToken)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        setToken(null)
        if (socket) {
            socket.close()
        }
    }

    if (!token || !isAuthenticated) {
        return (
            <AuthLayout>
                <LoginForm onLogin={handleLogin} />
            </AuthLayout>
        )
    }

    return (
        <ChatLayout
            user={user}
            messages={messages}
            dms={dms}
            currentRoom={currentRoom}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
            isConnected={isConnected}
            socket={socket}
            onLogout={handleLogout}
            onCreateDM={createDM}
            onSwitchRoom={switchToRoom}
        />
    )
}

export default App