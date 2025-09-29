import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
        <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
                // Define default options
                className: '',
                duration: 4000,
                style: {
                    background: '#363636',
                    color: '#fff',
                },
                // Default options for specific types
                success: {
                    duration: 3000,
                    iconTheme: {
                        primary: 'green',
                        secondary: 'white',
                    },
                },
                error: {
                    duration: 4000,
                    iconTheme: {
                        primary: 'red',
                        secondary: 'white',
                    },
                },
            }}
        />
    </StrictMode>,
)