import { useEffect, useRef } from 'react'

export const useNotifications = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Pedir permisos de notificación
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
            }
        }
    }, [])

    const playSound = () => {
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = context.createOscillator()
            const gainNode = context.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(context.destination)

            oscillator.frequency.value = 800
            oscillator.type = 'sine'

            gainNode.gain.setValueAtTime(0, context.currentTime)
            gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01)
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3)

            oscillator.start(context.currentTime)
            oscillator.stop(context.currentTime + 0.3)

            // Cerrar contexto después
            setTimeout(() => context.close(), 500)
        } catch (error) {
            console.error('Error playing sound:', error)
        }
    }

    const showNotification = (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/vite.svg',
                tag: 'chat-message',
                requireInteraction: false
            })
        }
    }

    const notifyNewMessage = (username: string, message: string, isDM: boolean = false) => {
        // Solo notificar si la ventana no tiene foco
        if (!document.hasFocus()) {
            playSound()
            showNotification(
                isDM ? `${username} (DM)` : username,
                message
            )
        }
    }

    return {
        notifyNewMessage,
        playSound
    }
}