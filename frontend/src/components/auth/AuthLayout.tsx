interface AuthLayoutProps {
    children: React.ReactNode
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl text-white font-bold">💬</span>
                    </div>
                </div>
                {children}
            </div>
        </div>
    )
}