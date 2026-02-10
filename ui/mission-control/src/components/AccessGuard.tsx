import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'

const ACCESS_KEY = import.meta.env.VITE_UI_ACCESS_KEY || 'dev-ui-access'
const STORAGE_KEY = 'kamino_access_verified'

interface AccessGuardProps {
    children: React.ReactNode
}

export default function AccessGuard({ children }: AccessGuardProps) {
    const [hasAccess, setHasAccess] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        // Check localStorage first
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === ACCESS_KEY) {
            setHasAccess(true)
            setChecking(false)
            return
        }

        // Check URL param
        const params = new URLSearchParams(window.location.search)
        const accessParam = params.get('access')

        if (accessParam === ACCESS_KEY) {
            localStorage.setItem(STORAGE_KEY, ACCESS_KEY)
            setHasAccess(true)
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname)
        }

        setChecking(false)
    }, [])

    if (checking) {
        return (
            <div className="h-screen w-screen bg-kamino-900 flex items-center justify-center">
                <div className="text-gray-400">Verifying access...</div>
            </div>
        )
    }

    if (!hasAccess) {
        return (
            <div className="h-screen w-screen bg-kamino-900 flex items-center justify-center">
                <div className="text-center">
                    <Shield size={64} className="mx-auto mb-4 text-red-500" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-gray-400">Invalid or missing access key</p>
                    <p className="text-xs text-gray-600 mt-4">Contact administrator for access link</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
