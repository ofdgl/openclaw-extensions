import { useEffect, useState } from 'react'
import { Shield, KeyRound } from 'lucide-react'
import { API_KEY, API_BASE_URL, setApiKey, isAuthenticated } from '../config/api'

interface AccessGuardProps {
    children: React.ReactNode
}

export default function AccessGuard({ children }: AccessGuardProps) {
    const [status, setStatus] = useState<'checking' | 'granted' | 'denied' | 'login'>('checking')
    const [inputKey, setInputKey] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isAuthenticated()) {
            setStatus('login')
            return
        }

        // Verify the key against the API
        fetch(`${API_BASE_URL}/api/auth/check?key=${API_KEY}`)
            .then(res => {
                if (res.ok) {
                    setStatus('granted')
                } else {
                    // Key is wrong — clear it and show login
                    localStorage.removeItem('kamino_api_key')
                    localStorage.removeItem('kamino_api_key_ts')
                    setStatus('login')
                }
            })
            .catch(() => {
                // Network error — allow through (API might be temporarily down)
                setStatus('granted')
            })
    }, [])

    const handleLogin = async () => {
        if (!inputKey.trim()) return
        setError('')

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/check?key=${inputKey}`)
            if (res.ok) {
                setApiKey(inputKey) // stores in localStorage + reloads
            } else {
                setError('Invalid API key')
            }
        } catch {
            setError('Cannot reach server')
        }
    }

    if (status === 'checking') {
        return (
            <div className="h-screen w-screen bg-kamino-900 flex items-center justify-center">
                <div className="text-gray-400">Verifying access...</div>
            </div>
        )
    }

    if (status === 'login') {
        return (
            <div className="h-screen w-screen bg-kamino-900 flex items-center justify-center">
                <div className="text-center max-w-sm w-full px-6">
                    <KeyRound size={48} className="mx-auto mb-4 text-kamino-accent" />
                    <h1 className="text-2xl font-bold text-white mb-2">Mission Control</h1>
                    <p className="text-gray-400 text-sm mb-6">Enter your API key to access</p>

                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            placeholder="API Key"
                            className="flex-1 bg-kamino-800 border border-kamino-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-kamino-accent"
                            autoFocus
                        />
                        <button
                            onClick={handleLogin}
                            className="px-4 py-2 bg-kamino-accent hover:bg-blue-600 rounded-lg text-white text-sm transition-colors"
                        >
                            Login
                        </button>
                    </div>

                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

                    <p className="text-xs text-gray-600 mt-4">
                        Or use <code className="text-gray-500">?key=YOUR_KEY</code> in the URL
                    </p>
                </div>
            </div>
        )
    }

    if (status === 'denied') {
        return (
            <div className="h-screen w-screen bg-kamino-900 flex items-center justify-center">
                <div className="text-center">
                    <Shield size={64} className="mx-auto mb-4 text-red-500" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-gray-400">Invalid or missing access key</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
