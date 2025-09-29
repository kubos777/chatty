import { useState } from 'react'
import toast from 'react-hot-toast'

interface LoginFormProps {
    onLogin: (token: string, user: any) => void
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
    const [showLogin, setShowLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()
            if (response.ok) {
                onLogin(data.access_token, data.user)
            } else {
                toast.error(data.detail || 'Login failed')
            }
        } catch (error) {
            toast.error('Network error')
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('http://localhost:8000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            })

            const data = await response.json()
            if (response.ok) {
                toast.success('User created! Please login.')
                setShowLogin(true)
            } else {
                toast.error(data.detail || 'Registration failed')
            }
        } catch (error) {
            toast.error('Network error')
        }
    }

    return (
        <>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {showLogin ? 'Welcome Back' : 'Join Us'}
            </h1>
            <p className="text-gray-500 mt-2 mb-8">
                {showLogin ? 'Sign in to continue chatting' : 'Create your account to get started'}
            </p>

            <form onSubmit={showLogin ? handleLogin : handleRegister} className="space-y-4">
                {!showLogin && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    {showLogin ? 'Sign In' : 'Create Account'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => setShowLogin(!showLogin)}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                    {showLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                </button>
            </div>
        </>
    )
}