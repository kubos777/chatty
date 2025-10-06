import { useEffect } from 'react'

export const useNotifications = () => {
    useEffect(() => {
        // Pedir permisos al cargar
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    const playSound = () => {
        try {
            // Crear un contexto de audio al momento de llamar
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext
            const audioContext = new AudioContext()

            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.type = 'sine'
            oscillator.frequency.value = 800

            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.5)

            // Cleanup
            setTimeout(() => audioContext.close(), 1000)
        } catch (error) {
            console.error('Audio error:', error)
        }
    }

    const notifyNewMessage = (username: string, message: string, isDM: boolean = false) => {
        // Siempre intentar reproducir sonido
        playSound()

        // Mostrar notificación si no tiene foco
        if (!document.hasFocus()) {
            if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(
                    isDM ? `💬 ${username} (DM)` : `💬 ${username}`,
                    {
                        body: message.substring(0, 100),
                        icon: '/vite.svg',
                        badge: '/vite.svg',
                        tag: `chat-${isDM ? 'dm' : 'public'}`,
                        requireInteraction: false
                    }
                )

                notification.onclick = () => {
                    window.focus()
                    notification.close()
                }

                // Auto-cerrar después de 4 segundos
                setTimeout(() => notification.close(), 4000)
            }
        }
    }

    return {
        notifyNewMessage,
        playSound
    }
}