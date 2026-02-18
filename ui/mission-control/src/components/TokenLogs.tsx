import { Search, Download, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Page, NavState } from '../App'
import { API_BASE_URL, API_KEY } from '../config/api'

interface TokenLogsProps {
    onNavigate?: (page: Page, state?: NavState) => void
}

interface TokenLog {
    id: string
    timestamp: string
    user: string
    phone: string
    message: string
    model: string
    tokens: number
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheCreationTokens: number
    cost: number
    role: string
    channel: string
    session: string
    agentId: string
    thinking?: string
    tools?: string[]
    retries?: number
}

export default function TokenLogs({ onNavigate }: TokenLogsProps = {}) {
    const [logs, setLogs] = useState<TokenLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [filter, setFilter] = useState('')
    const [modelFilter, setModelFilter] = useState('all')
    const [selectedLog, setSelectedLog] = useState<TokenLog | null>(null)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const params = new URLSearchParams({ key: API_KEY, limit: '100' })
                if (modelFilter !== 'all') params.append('model', modelFilter)

                const res = await fetch(`${API_BASE_URL}/api/logs/tokens?${params}`)

                if (res.ok) {
                    const data = await res.json()
                    setLogs(data.logs)
                    setError(false)
                } else {
                    setError(true)
                }
            } catch (e) {
                console.error('Failed to fetch token logs:', e)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchLogs()
        const interval = setInterval(fetchLogs, 10000)
        return () => clearInterval(interval)
    }, [modelFilter])

    const filteredLogs = logs.filter(log =>
        filter === '' ||
        log.user.toLowerCase().includes(filter.toLowerCase()) ||
        log.message.toLowerCase().includes(filter.toLowerCase()) ||
        (log.phone && log.phone.includes(filter))
    )

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="text-gray-400">Loading token logs...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Logs</h2>
                    <p className="text-gray-400 mb-4">Cannot fetch token logs from API</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-kamino-accent rounded-lg text-white hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    const totalTokens = filteredLogs.reduce((s, l) => s + l.tokens, 0)
    const totalCost = filteredLogs.reduce((s, l) => s + l.cost, 0)

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Token & Message Logs</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search user, message, phone..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-kamino-700 border border-kamino-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kamino-accent"
                        />
                    </div>
                    <select
                        value={modelFilter}
                        onChange={(e) => setModelFilter(e.target.value)}
                        className="px-4 py-2 bg-kamino-700 border border-kamino-600 rounded-lg text-white focus:outline-none focus:border-kamino-accent"
                    >
                        <option value="all">All Models</option>
                        <option value="claude">Claude</option>
                        <option value="gemini">Gemini</option>
                        <option value="openrouter">OpenRouter</option>
                    </select>
                    <button className="p-2 bg-kamino-700 hover:bg-kamino-600 rounded-lg border border-kamino-600">
                        <Download size={18} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Total Messages</div>
                    <div className="text-2xl font-bold text-white">{filteredLogs.length}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Total Tokens</div>
                    <div className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Total Cost</div>
                    <div className="text-2xl font-bold text-orange-400">${totalCost.toFixed(4)}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Avg Cost/Msg</div>
                    <div className="text-2xl font-bold text-white">
                        ${filteredLogs.length > 0 ? (totalCost / filteredLogs.length).toFixed(4) : '0.0000'}
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-kamino-800 rounded-lg border border-kamino-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-kamino-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">TIME</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">USER</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">ROLE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">MESSAGE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">MODEL</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">TOKENS</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">COST</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-kamino-700">
                            {filteredLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    onClick={() => setSelectedLog(log)}
                                    className="hover:bg-kamino-700/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 text-sm text-gray-400">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-white">{log.user}</td>
                                    <td className="px-4 py-3">
                                        <RoleBadge role={log.role} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                                        {log.message}
                                    </td>
                                    <td className="px-4 py-3">
                                        <ModelBadge model={log.model} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-300">
                                        {log.tokens.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">
                                        <span className={log.cost > 0 ? 'text-orange-400' : 'text-green-400'}>
                                            {log.cost > 0 ? `$${log.cost.toFixed(4)}` : 'Free'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedLog(null)}>
                    <div className="bg-kamino-800 border border-kamino-600 rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-kamino-700">
                            <h3 className="text-lg font-semibold text-white">Message Details</h3>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Sender Info */}
                            <div className="grid grid-cols-2 gap-3">
                                <InfoRow label="User" value={selectedLog.user} />
                                <InfoRow label="Phone" value={selectedLog.phone || '—'} />
                                <InfoRow label="Channel" value={selectedLog.channel || 'whatsapp'} />
                                <InfoRow label="Role" value={selectedLog.role} />
                                <InfoRow label="Agent" value={selectedLog.agentId || 'main'} />
                                <InfoRow label="Session" value={selectedLog.session} />
                                <InfoRow label="Model" value={selectedLog.model} />
                                <InfoRow label="Time" value={new Date(selectedLog.timestamp).toLocaleString()} />
                            </div>

                            {/* Message Content */}
                            <div>
                                <div className="text-xs font-semibold text-gray-400 mb-1">MESSAGE CONTENT</div>
                                <div className="bg-kamino-900 rounded-lg p-3 text-sm text-gray-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                    {selectedLog.message || '(empty)'}
                                </div>
                            </div>

                            {/* Token Breakdown */}
                            <div>
                                <div className="text-xs font-semibold text-gray-400 mb-2">TOKEN BREAKDOWN</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-kamino-900 rounded-lg p-3 flex justify-between">
                                        <span className="text-sm text-gray-400">Input</span>
                                        <span className="text-sm text-white font-medium">{selectedLog.inputTokens?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="bg-kamino-900 rounded-lg p-3 flex justify-between">
                                        <span className="text-sm text-gray-400">Output</span>
                                        <span className="text-sm text-white font-medium">{selectedLog.outputTokens?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="bg-kamino-900 rounded-lg p-3 flex justify-between">
                                        <span className="text-sm text-gray-400">Cache Read</span>
                                        <span className="text-sm text-blue-400 font-medium">{selectedLog.cacheReadTokens?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="bg-kamino-900 rounded-lg p-3 flex justify-between">
                                        <span className="text-sm text-gray-400">Cache Write</span>
                                        <span className="text-sm text-blue-400 font-medium">{selectedLog.cacheCreationTokens?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cost */}
                            <div className="flex justify-between items-center bg-kamino-900 rounded-lg p-3">
                                <span className="text-sm text-gray-400">Total Cost</span>
                                <span className={`text-lg font-bold ${selectedLog.cost > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                    {selectedLog.cost > 0 ? `$${selectedLog.cost.toFixed(6)}` : 'Free'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-kamino-900 rounded-lg p-2">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm text-white truncate">{value}</div>
        </div>
    )
}

function RoleBadge({ role }: { role: string }) {
    const isUser = role === 'user'
    return (
        <span className={`text-xs px-2 py-1 rounded-full border ${isUser
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            }`}>
            {isUser ? 'User' : 'AI'}
        </span>
    )
}

function ModelBadge({ model }: { model: string }) {
    const getColorClass = () => {
        if (model.includes('claude')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        if (model.includes('gemini')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        if (model.includes('openrouter')) return 'bg-green-500/20 text-green-400 border-green-500/30'
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }

    const getShortName = () => {
        if (model.includes('claude-sonnet')) return 'Sonnet'
        if (model.includes('gemini-flash')) return 'Flash'
        if (model.includes('llama')) return 'Llama'
        return model.split('/').pop() || model
    }

    return (
        <span className={`text-xs px-2 py-1 rounded-full border ${getColorClass()}`}>
            {getShortName()}
        </span>
    )
}
