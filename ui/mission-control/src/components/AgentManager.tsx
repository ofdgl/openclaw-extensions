import { Users, ChevronDown, FileText, MessageSquare, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API_BASE_URL, API_KEY } from '../config/api'
import type { Page, NavState } from '../App'

interface Agent {
    id: string
    name: string
    status: string
    workspace: string
    model: string
    sessions: number
    outputs: number
    hasSoul: boolean
    soulName: string
    tools: string | string[]
    sandbox: boolean
}

interface ModelOption {
    id: string
    name: string
    provider: string
}

interface AgentManagerProps {
    onNavigate?: (page: Page, state?: NavState) => void
}

export default function AgentManager({ onNavigate }: AgentManagerProps) {
    const [agents, setAgents] = useState<Agent[]>([])
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [availableModels, setAvailableModels] = useState<ModelOption[]>([])
    const [modelChanging, setModelChanging] = useState<string | null>(null)

    const fetchAgents = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/agents?key=${API_KEY}`)
            if (res.ok) {
                const data = await res.json()
                setAgents(data.agents || [])
                setAvailableModels(data.availableModels || [])
            }
        } catch (e) {
            console.error('Failed to fetch agents:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAgents()
        const interval = setInterval(fetchAgents, 15000)
        return () => clearInterval(interval)
    }, [])

    const changeModel = async (agentId: string, newModel: string) => {
        setModelChanging(agentId)
        try {
            const res = await fetch(`${API_BASE_URL}/api/agents/${agentId}/model?key=${API_KEY}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: newModel })
            })
            if (res.ok) {
                setAgents(prev => prev.map(a =>
                    a.id === agentId ? { ...a, model: newModel } : a
                ))
            }
        } catch (e) {
            console.error('Failed to change model:', e)
        } finally {
            setModelChanging(null)
        }
    }

    const getModelDisplayName = (modelId: string) => {
        const model = availableModels.find(m => m.id === modelId)
        if (model) return model.name
        const short = modelId.split('/').pop() || modelId
        return short
    }

    const agent = selectedAgent ? agents.find(a => a.id === selectedAgent) : null

    if (loading) {
        return <div className="p-6 text-gray-400">Loading agents...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white">Agent Management</h1>

            {/* Agent Details Panel — ABOVE the grid */}
            {agent && (
                <div className="bg-kamino-800 rounded-lg border border-kamino-accent p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-white">{agent.name}</h2>
                            <StatusBadge status={agent.status} />
                        </div>
                        <button
                            onClick={() => setSelectedAgent(null)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <InfoCard label="Model" value={getModelDisplayName(agent.model)} />
                        <InfoCard label="Sessions" value={String(agent.sessions)} />
                        <InfoCard label="SOUL" value={agent.hasSoul ? agent.soulName : 'None'} accent={agent.hasSoul} />
                        <InfoCard label="Tools" value={agent.tools === 'all' ? 'All' : Array.isArray(agent.tools) ? `${agent.tools.length} tools` : '0'} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {agent.hasSoul && onNavigate && (
                            <button
                                onClick={() => onNavigate('memory', {
                                    openFilePath: `/root/.openclaw/agents/${agent.id}/agent/SOUL.md`
                                })}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-lg hover:bg-purple-600/30 transition-colors text-sm"
                            >
                                <FileText size={16} />
                                View SOUL
                            </button>
                        )}
                        {onNavigate && (
                            <button
                                onClick={() => onNavigate('sessions', { filterAgent: agent.id })}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                            >
                                <MessageSquare size={16} />
                                View Sessions ({agent.sessions})
                            </button>
                        )}
                        {onNavigate && (
                            <button
                                onClick={() => onNavigate('memory', {
                                    openFilePath: `/root/.openclaw/agents/${agent.id}/`
                                })}
                                className="flex items-center gap-2 px-4 py-2 bg-kamino-600/20 text-kamino-accent border border-kamino-600/30 rounded-lg hover:bg-kamino-600/30 transition-colors text-sm"
                            >
                                <Users size={16} />
                                Browse Workspace
                            </button>
                        )}
                    </div>

                    {agent.sandbox && (
                        <div className="mt-3 text-xs text-yellow-400 flex items-center gap-1">
                            🔒 Sandboxed agent — restricted tool access
                        </div>
                    )}
                </div>
            )}

            {/* Agent Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((a) => (
                    <div
                        key={a.id}
                        onClick={() => setSelectedAgent(a.id === selectedAgent ? null : a.id)}
                        className={`bg-kamino-800 rounded-lg p-4 border cursor-pointer transition-all ${selectedAgent === a.id
                            ? 'border-kamino-accent ring-1 ring-kamino-accent/20'
                            : 'border-kamino-700 hover:border-kamino-600'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-white">{a.name}</h3>
                            <StatusBadge status={a.status} />
                        </div>

                        {/* Model Selection */}
                        <div className="mb-3">
                            <label className="text-xs text-gray-500 block mb-1">Model</label>
                            <select
                                value={a.model}
                                onChange={(e) => {
                                    e.stopPropagation()
                                    changeModel(a.id, e.target.value)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                disabled={modelChanging === a.id}
                                className="w-full bg-kamino-900 text-white text-sm px-2 py-1.5 rounded border border-kamino-600 focus:border-kamino-accent focus:outline-none disabled:opacity-50"
                            >
                                {availableModels.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                                ))}
                                {!availableModels.find(m => m.id === a.model) && (
                                    <option value={a.model}>{getModelDisplayName(a.model)}</option>
                                )}
                            </select>
                        </div>

                        <div className="space-y-1 text-sm text-gray-400">
                            <div>Sessions: <span className="text-white">{a.sessions}</span></div>
                            <div>SOUL: <span className={a.hasSoul ? 'text-green-400' : 'text-gray-500'}>{a.hasSoul ? `✓ ${a.soulName}` : '✗ None'}</span></div>
                            <div>Tools: <span className="text-white">{a.tools === 'all' ? 'All' : Array.isArray(a.tools) ? a.tools.length : '0'}</span></div>
                            {a.sandbox && <div className="text-yellow-400 text-xs">🔒 Sandboxed</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function InfoCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="bg-kamino-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={`text-sm font-medium ${accent ? 'text-green-400' : 'text-white'}`}>{value}</div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const colors = {
        active: 'bg-green-500/20 text-green-400 border-green-500/30',
        idle: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        offline: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    return (
        <span className={`text-xs px-2 py-1 rounded-full border ${colors[status as keyof typeof colors] || colors.offline}`}>
            {status}
        </span>
    )
}
