// frontend/src/hooks/useSocket.ts
import {useEffect, useRef, useState} from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import {useNotifications} from "./useNotifications.ts";

interface Message {
    id: string
    message: string
    username: string
    room_id: string
    timestamp: string
    type?: string
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
    const [messages, setMessages] = useState<Message[]>([])
    const [dmMessages, setDmMessages] = useState<Record<number, Message[]>>({})
    const [dms, setDms] = useState<DM[]>([])
    const [currentRoom, setCurrentRoom] = useState<{ id: number, type: 'public' | 'dm' }>({ id: 1, type: 'public' })
    const [onlineUsers, setOnlineUsers] = useState<Array<{username: string, status: string}>>([])
    const [typingUsers, setTypingUsers] = useState<string[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [user, setUser] = useState<User | null>(null)

    const currentRoomRef = useRef(currentRoom)
    const { notifyNewMessage } = useNotifications()

    // Load DMs when authenticated
    useEffect(() => {
        if (isAuthenticated && token) {
            loadDMs()
        }
    }, [isAuthenticated, token])

    useEffect(() => {
        currentRoomRef.current = currentRoom
    }, [currentRoom])

    const loadDMs = async () => {
        if (!token) return

        try {
            const response = await fetch('http://localhost:8000/dms', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            setDms(data.dms || [])
        } catch (error) {
            console.error('Error loading DMs:', error)
        }
    }

    const loadRoomMessages = async (roomId: number) => {
        if (!token) return

        try {
            const response = await fetch(`http://localhost:8000/messages/${roomId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()

            // Actualizar según el tipo de room actual
            if (currentRoomRef.current.type === 'dm') {
                setDmMessages(prev => ({
                    ...prev,
                    [roomId]: data.messages
                }))
            } else {
                setMessages(data.messages)
            }
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
            })

            newSocket.on('auth_error', (data) => {
                toast.error(data.message)
            })

            newSocket.on('users_list_with_status', (data) => {
                setOnlineUsers(data.users)
            })

            newSocket.on('new_message', (data) => {
                if (currentRoom.type === 'public' && data.room_id === currentRoom.id) {
                    setMessages(prev => [...prev, data])
                }
                if (currentRoomRef.current.type !== 'public' || data.room_id !== currentRoomRef.current.id) {
                    notifyNewMessage(data.username, data.message, false)
                }
            })

            newSocket.on('dm_created', (data) => {
                toast.success(`DM with ${data.with_user} created!`)

                // Agregar el DM a la lista
                setDms(prev => {
                    // Evitar duplicados
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

                // Cambiar automáticamente a ese DM
                setCurrentRoom({ id: data.id, type: 'dm' })
                loadRoomMessages(data.id)
            })

            newSocket.on('new_dm_message', (data) => {
                setDmMessages(prev => ({
                    ...prev,
                    [data.room_id]: [...(prev[data.room_id] || []), data]
                }))

                if (currentRoomRef.current.type !== 'dm' || data.room_id !== currentRoomRef.current.id) {
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

    const switchToRoom = async (roomId: number, type: 'public' | 'dm') => {
        setCurrentRoom({ id: roomId, type })

        // Limpiar unread
        if (type === 'dm') {
            setDms(prev => prev.map(dm =>
                dm.id === roomId ? { ...dm, unread_count: 0 } : dm
            ))
        }

        // Cargar mensajes
        await loadRoomMessages(roomId)

        if (socket) {
            if (type === 'public') {
                socket.emit('join_room', { room_id: roomId })
            }
        }
    }


    return {
        socket,
        messages: currentRoom.type === 'dm' ? (dmMessages[currentRoom.id] || []) : messages,
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