import {useEffect, useRef, useState} from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import {useNotifications} from "./useNotifications.ts"

interface Message {
    id: string
    message: string
    username: string
    room_id: number  // Cambiar a number
    timestamp: string
    roomType?: 'public' | 'dm'  // Agregar esta propiedad
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
    last_message_time?: string
    unread_count?: number
}

export const useSocket = (token: string | null) => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [allMessages, setAllMessages] = useState<Message[]>([])
    const [dms, setDms] = useState<DM[]>([])
    const [currentRoom, setCurrentRoom] = useState<{ id: number, type: 'public' | 'dm' }>({ id: 1, type: 'public' })
    const [onlineUsers, setOnlineUsers] = useState<Array<{username: string, status: string}>>([])
    const [typingUsers, setTypingUsers] = useState<string[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [user, setUser] = useState<User | null>(null)

    const currentRoomRef = useRef(currentRoom)
    const { notifyNewMessage } = useNotifications()

    useEffect(() => {
        currentRoomRef.current = currentRoom
    }, [currentRoom])

    useEffect(() => {
        if (isAuthenticated && token) {
            loadDMs()
        }
    }, [isAuthenticated, token])

    const loadDMs = async () => {
        if (!token) return

        try {
            const response = await fetch('http://localhost:8000/dms', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            setDms(data.dms || [])
        } catch (error) {
            console.error('Error loading DMs:', error)
        }
    }

    const loadRoomMessages = async (roomId: number, roomType: 'public' | 'dm') => {
        if (!token) return

        try {
            const response = await fetch(`http://localhost:8000/messages/${roomId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()

            // Agregar los mensajes al allMessages con el roomType correcto
            const messagesWithType = data.messages.map((msg: Message) => ({
                ...msg,
                roomType
            }))

            setAllMessages(prev => {
                // Remover mensajes viejos de este room
                const filtered = prev.filter(m => m.room_id !== roomId)
                return [...filtered, ...messagesWithType]
            })
        } catch (error) {
            console.error('Error loading messages:', error)
        }
    }

    useEffect(() => {
        if (token) {
            const newSocket = io('http://localhost:8000')

            newSocket.on('connect', () => {
                setIsConnected(true)
                newSocket.emit('authenticate', { token })
            })

            newSocket.on('disconnect', () => {
                setIsConnected(false)
                setIsAuthenticated(false)
            })

            newSocket.on('authenticated', (data) => {
                setUser(data.user)
                setIsAuthenticated(true)
                toast.success(`Welcome back, ${data.user.username}!`)
                newSocket.emit('join_room', { room_id: 1 })
                // Cargar mensajes del room público inicial
                loadRoomMessages(1, 'public')
            })

            newSocket.on('auth_error', (data) => {
                toast.error(data.message)
            })

            newSocket.on('users_list_with_status', (data) => {
                setOnlineUsers(data.users)
            })

            newSocket.on('new_message', (data) => {
                setAllMessages(prev => [...prev, { ...data, roomType: 'public' as const }])

                // Notificar si no estás en ese room
                if (currentRoomRef.current.type !== 'public' || currentRoomRef.current.id !== data.room_id) {
                    notifyNewMessage(data.username, data.message, false)
                }
            })

            newSocket.on('dm_created', (data) => {
                toast.success(`DM with ${data.with_user} created!`)

                setDms(prev => {
                    const exists = prev.some(dm => dm.id === data.id)
                    if (exists) return prev

                    return [...prev, {
                        id: data.id,
                        name: data.name,
                        type: 'dm',
                        with_user: data.with_user,
                        with_user_id: data.with_user_id || 0,
                        unread_count: 0
                    }]
                })

                // Cambiar a ese DM y cargar mensajes
                setCurrentRoom({ id: data.id, type: 'dm' })
                loadRoomMessages(data.id, 'dm')
            })

            newSocket.on('new_dm_message', (data) => {
                setAllMessages(prev => [...prev, { ...data, roomType: 'dm' as const }])

                // Notificar si no estás en ese DM
                if (currentRoomRef.current.type !== 'dm' || currentRoomRef.current.id !== data.room_id) {
                    notifyNewMessage(data.username, data.message, true)

                    setDms(prev => prev.map(dm =>
                        dm.id === data.room_id
                            ? { ...dm, unread_count: (dm.unread_count || 0) + 1, last_message: data.message }
                            : dm
                    ))
                }
            })

            newSocket.on('dm_error', (data) => {
                toast.error(data.message)
            })

            newSocket.on('typing_start', (data) => {
                setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username])
            })

            newSocket.on('typing_stop', (data) => {
                setTypingUsers(prev => prev.filter(u => u !== data.username))
            })

            newSocket.on('status_changed', (data) => {
                toast(`${data.username} is now ${data.status}`)
            })

            setSocket(newSocket)

            return () => {
                newSocket.removeAllListeners()
                newSocket.close()
            }
        }
    }, [token])

    const createDM = (targetUsername: string) => {
        if (socket) {
            socket.emit('create_dm', { target_username: targetUsername })
        }
    }

    const switchToRoom = (roomId: number, type: 'public' | 'dm') => {
        setCurrentRoom({ id: roomId, type })

        // Limpiar unread
        if (type === 'dm') {
            setDms(prev => prev.map(dm =>
                dm.id === roomId ? { ...dm, unread_count: 0 } : dm
            ))
        }

        // Cargar mensajes si no están en memoria
        const hasMessages = allMessages.some(m => m.room_id === roomId && m.roomType === type)
        if (!hasMessages) {
            loadRoomMessages(roomId, type)
        }

        if (socket && type === 'public') {
            socket.emit('join_room', { room_id: roomId })
        }
    }

    // Filtrar mensajes según el room actual
    const currentMessages = allMessages.filter(m =>
        m.room_id === currentRoom.id && m.roomType === currentRoom.type
    )

    return {
        socket,
        messages: currentMessages,
        dms,
        currentRoom,
        onlineUsers,
        typingUsers,
        isConnected,
        isAuthenticated,
        user,
        createDM,
        switchToRoom,
        loadDMs
    }
}