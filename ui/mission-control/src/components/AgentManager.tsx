import { Users, Play, Pause, Activity, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API_BASE_URL, API_KEY } from '../config/api'

interface Agent {
    id: string
    name: string
    status: string
    workspace: string
    model: string
    sessions: number
    outputs: number
    hasSoul: boolean
    tools: string | string[]
    sandbox: boolean
}

interface ModelOption {
    id: string
    name: string
    provider: string
}

export default function AgentManager() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
    const [outputs, setOutputs] = useState<any[]>([])
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

    useEffect(() => {
        if (!selectedAgent) return

        const fetchOutputs = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/agents/${selectedAgent}/outputs?key=${API_KEY}`)
                if (res.ok) {
                    const data = await res.json()
                    setOutputs(data.outputs)
                }
            } catch (e) {
                console.error('Failed to fetch outputs:', e)
            }
        }

        fetchOutputs()
    }, [selectedAgent])

    const changeModel = async (agentId: string, newModel: string) => {
        setModelChanging(agentId)
        try {
            const res = await fetch(`${API_BASE_URL}/api/agents/${agentId}/model?key=${API_KEY}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: newModel })
            })
            if (res.ok) {
                // Update local state
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
        // Extract readable name from model id
        if (modelId.includes('sonnet-4-5')) return 'Sonnet 4.5'
        if (modelId.includes('sonnet-4')) return 'Sonnet 4'
        if (modelId.includes('haiku')) return 'Haiku 3.5'
        if (modelId.includes('opus')) return 'Opus 4'
        return modelId.split('/').pop() || modelId
    }

    if (loading) {
        return <div className="p-6 text-gray-400">Loading agents...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white">Agent Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent.id)}
                        className={`bg-kamino-800 rounded-lg p-4 border cursor-pointer transition-colors ${selectedAgent === agent.id
                            ? 'border-kamino-accent'
                            : 'border-kamino-700 hover:border-kamino-600'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-white">{agent.name}</h3>
                            <StatusBadge status={agent.status} />
                        </div>

                        {/* Model Selection */}
                        <div className="mb-3">
                            <label className="text-xs text-gray-500 block mb-1">Model</label>
                            <select
                                value={agent.model}
                                onChange={(e) => {
                                    e.stopPropagation()
                                    changeModel(agent.id, e.target.value)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                disabled={modelChanging === agent.id}
                                className="w-full bg-kamino-900 text-white text-sm px-2 py-1.5 rounded border border-kamino-600 focus:border-kamino-accent focus:outline-none disabled:opacity-50"
                            >
                                {availableModels.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                                ))}
                                {/* Show current model if not in list */}
                                {!availableModels.find(m => m.id === agent.model) && (
                                    <option value={agent.model}>{getModelDisplayName(agent.model)}</option>
                                )}
                            </select>
                        </div>

                        <div className="space-y-1 text-sm text-gray-400">
                            <div>Sessions: <span className="text-white">{agent.sessions}</span></div>
                            <div>SOUL: <span className={agent.hasSoul ? 'text-green-400' : 'text-gray-500'}>{agent.hasSoul ? '✓ Loaded' : '✗ None'}</span></div>
                            <div>Tools: <span className="text-white">{agent.tools === 'all' ? 'All' : Array.isArray(agent.tools) ? agent.tools.length : '0'}</span></div>
                            {agent.sandbox && <div className="text-yellow-400 text-xs">🔒 Sandboxed</div>}
                        </div>
                    </div>
                ))}
            </div>

            {selectedAgent && (
                <div className="bg-kamino-800 rounded-lg border border-kamino-700 p-6">
                    <h2 className="font-semibold text-white mb-4">Agent Details: {agents.find(a => a.id === selectedAgent)?.name}</h2>
                    <div className="space-y-3">
                        {outputs.length > 0 ? (
                            outputs.map((output) => (
                                <div key={output.id} className="bg-kamino-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-500">{output.type}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(output.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300">{output.content}</p>
                                    <div className="text-xs text-gray-500 mt-2">{output.tokens} tokens</div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">No recent outputs for this agent.</p>
                        )}
                    </div>
                </div>
            )}
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
