import { Puzzle, Play, Pause, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API_BASE_URL, API_KEY } from '../config/api'

interface Hook {
    id: string
    name: string
    enabled: boolean
    executions: number
    lastRun: string | null
    status: string
}

export default function HookManager() {
    const [hooks, setHooks] = useState<Hook[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHooks()
        const interval = setInterval(fetchHooks, 15000)
        return () => clearInterval(interval)
    }, [])

    const fetchHooks = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/hooks?key=${API_KEY}`)
            if (res.ok) {
                const data = await res.json()
                setHooks(data.hooks)
            }
        } catch (e) {
            console.error('Failed to fetch hooks:', e)
        } finally {
            setLoading(false)
        }
    }

    const toggleHook = async (id: string, enabled: boolean) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/hooks/${id}?key=${API_KEY}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !enabled })
            })
            if (res.ok) fetchHooks()
        } catch (e) {
            console.error('Failed to toggle hook:', e)
        }
    }

    if (loading) {
        return <div className="p-6 text-gray-400">Loading hooks...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Hook Management</h1>
                <button
                    onClick={fetchHooks}
                    className="p-2 bg-kamino-700 hover:bg-kamino-600 rounded-lg border border-kamino-600"
                >
                    <RefreshCw size={18} className="text-gray-400" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {hooks.map((hook) => (
                    <div
                        key={hook.id}
                        className="bg-kamino-800 rounded-lg p-4 border border-kamino-700"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Puzzle size={18} className="text-kamino-accent" />
                                <h3 className="font-semibold text-white">{hook.name}</h3>
                            </div>
                            <button
                                onClick={() => toggleHook(hook.id, hook.enabled)}
                                className={`p-2 rounded-lg transition-colors ${hook.enabled
                                    ? 'bg-green-500/20 hover:bg-green-500/30'
                                    : 'bg-gray-500/20 hover:bg-gray-500/30'
                                    }`}
                            >
                                {hook.enabled ? (
                                    <Pause size={16} className="text-green-400" />
                                ) : (
                                    <Play size={16} className="text-gray-400" />
                                )}
                            </button>
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                            <div>Status: <span className={hook.enabled ? 'text-green-400' : 'text-gray-500'}>
                                {hook.enabled ? 'Enabled' : 'Disabled'}
                            </span></div>
                            <div>Executions: <span className="text-white">{hook.executions}</span></div>
                            {hook.lastRun && (
                                <div>Last Run: <span className="text-white">
                                    {new Date(hook.lastRun).toLocaleString()}
                                </span></div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
