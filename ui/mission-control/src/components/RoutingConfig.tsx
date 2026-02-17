import { useState, useEffect } from 'react'
import { Network, Plus, Trash2, Save, RefreshCw, ArrowRight, Users } from 'lucide-react'
import { API_BASE_URL, API_KEY } from '../config/api'

interface AgentConfig {
    id: string
    name?: string
    model?: string
    workspace?: string
    default?: boolean
    tools?: any
    sandbox?: any
    identity?: any
}

interface Binding {
    agentId: string
    match: {
        channel?: string
        peer?: { kind: string; id: string }
        account?: string
    }
}

interface RoutingData {
    agents: AgentConfig[]
    bindings: Binding[]
    defaultAgent: string
    defaultModel: string
}

export default function RoutingConfig() {
    const [data, setData] = useState<RoutingData>({ agents: [], bindings: [], defaultAgent: 'main', defaultModel: 'unknown' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [newBindingAgent, setNewBindingAgent] = useState('')
    const [newBindingPeer, setNewBindingPeer] = useState('')
    const [newBindingChannel, setNewBindingChannel] = useState('whatsapp')

    useEffect(() => {
        fetchRouting()
    }, [])

    const fetchRouting = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/routing?key=${API_KEY}`)
            if (res.ok) {
                const d = await res.json()
                setData(d)
            }
        } catch (e) {
            console.error('Failed to fetch routing:', e)
        } finally {
            setLoading(false)
        }
    }

    const saveAgents = async () => {
        setSaving(true)
        try {
            await fetch(`${API_BASE_URL}/api/routing/agents?key=${API_KEY}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agents: data.agents })
            })
            await fetch(`${API_BASE_URL}/api/routing/bindings?key=${API_KEY}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bindings: data.bindings })
            })
            await fetchRouting()
        } catch (e) {
            console.error('Failed to save:', e)
        } finally {
            setSaving(false)
        }
    }

    const addBinding = () => {
        if (!newBindingAgent || !newBindingPeer) return
        const binding: Binding = {
            agentId: newBindingAgent,
            match: {
                channel: newBindingChannel,
                peer: { kind: 'dm', id: newBindingPeer }
            }
        }
        setData(prev => ({ ...prev, bindings: [...prev.bindings, binding] }))
        setNewBindingAgent('')
        setNewBindingPeer('')
    }

    const removeBinding = (index: number) => {
        setData(prev => ({
            ...prev,
            bindings: prev.bindings.filter((_, i) => i !== index)
        }))
    }

    const updateAgent = (idx: number, field: string, value: string) => {
        setData(prev => {
            const agents = [...prev.agents]
            agents[idx] = { ...agents[idx], [field]: value }
            return { ...prev, agents }
        })
    }

    if (loading) {
        return <div className="p-6 text-gray-400">Loading routing configuration...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Routing Configuration</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Configure multi-agent routing via openclaw.json bindings
                    </p>
                </div>
                <button
                    onClick={saveAgents}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-kamino-accent hover:bg-blue-600 disabled:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                >
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save All'}
                </button>
            </div>

            {/* Agents List */}
            <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                <div className="flex items-center gap-3 mb-4">
                    <Users size={20} className="text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Agent Definitions</h2>
                    <span className="text-xs text-gray-500">(agents.list in openclaw.json)</span>
                </div>

                {data.agents.length === 0 ? (
                    <div className="text-gray-400 text-sm py-4 text-center">
                        No agents configured in agents.list. Messages route to the default agent.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.agents.map((agent, idx) => (
                            <div key={agent.id} className="grid grid-cols-5 gap-3 items-center p-3 bg-kamino-900 rounded-lg">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Agent ID</div>
                                    <div className="text-white font-mono text-sm">{agent.id}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Model</div>
                                    <input
                                        type="text"
                                        value={agent.model || ''}
                                        onChange={(e) => updateAgent(idx, 'model', e.target.value)}
                                        placeholder="(uses default)"
                                        className="w-full bg-kamino-800 border border-kamino-700 rounded px-2 py-1 text-sm text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Workspace</div>
                                    <input
                                        type="text"
                                        value={agent.workspace || ''}
                                        onChange={(e) => updateAgent(idx, 'workspace', e.target.value)}
                                        className="w-full bg-kamino-800 border border-kamino-700 rounded px-2 py-1 text-sm text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Default</div>
                                    <div className={`text-sm ${agent.default ? 'text-green-400' : 'text-gray-500'}`}>
                                        {agent.default ? '✓ Default' : '—'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <button
                                        onClick={() => setData(prev => ({
                                            ...prev,
                                            agents: prev.agents.filter((_, i) => i !== idx)
                                        }))}
                                        className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                    Default Agent: <span className="text-white font-mono">{data.defaultAgent}</span>
                    {' • '}
                    Default Model: <span className="text-white font-mono">{data.defaultModel}</span>
                </div>
            </div>

            {/* Bindings */}
            <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                <div className="flex items-center gap-3 mb-4">
                    <Network size={20} className="text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Routing Bindings</h2>
                    <span className="text-xs text-gray-500">(bindings[] in openclaw.json)</span>
                </div>

                <p className="text-sm text-gray-400 mb-4">
                    Bindings map incoming messages to specific agents based on channel, peer, or account.
                </p>

                {/* Existing bindings */}
                {data.bindings.length === 0 ? (
                    <div className="text-gray-400 text-sm py-4 text-center mb-4">
                        No bindings configured. All messages go to the default agent.
                    </div>
                ) : (
                    <div className="space-y-2 mb-4">
                        {data.bindings.map((binding, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-kamino-900 rounded-lg">
                                <div className="flex-1 flex items-center gap-3 text-sm">
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-mono">
                                        {binding.match?.channel || 'any'}
                                    </span>
                                    {binding.match?.peer && (
                                        <>
                                            <span className="text-gray-500">peer:</span>
                                            <span className="text-white font-mono">
                                                {binding.match.peer.id}
                                            </span>
                                        </>
                                    )}
                                    {binding.match?.account && (
                                        <>
                                            <span className="text-gray-500">account:</span>
                                            <span className="text-white font-mono">
                                                {binding.match.account}
                                            </span>
                                        </>
                                    )}
                                    <ArrowRight size={14} className="text-gray-500" />
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-mono">
                                        {binding.agentId}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeBinding(idx)}
                                    className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add new binding */}
                <div className="p-4 bg-kamino-900 rounded-lg border border-dashed border-kamino-600">
                    <div className="text-xs text-gray-400 mb-2">Add New Binding</div>
                    <div className="flex items-center gap-3">
                        <select
                            value={newBindingChannel}
                            onChange={(e) => setNewBindingChannel(e.target.value)}
                            className="bg-kamino-800 border border-kamino-700 rounded px-2 py-1.5 text-sm text-white"
                        >
                            <option value="whatsapp">WhatsApp</option>
                            <option value="telegram">Telegram</option>
                            <option value="discord">Discord</option>
                            <option value="webchat">WebChat</option>
                        </select>
                        <input
                            type="text"
                            value={newBindingPeer}
                            onChange={(e) => setNewBindingPeer(e.target.value)}
                            placeholder="Phone/Peer ID (e.g. +905357874261)"
                            className="flex-1 bg-kamino-800 border border-kamino-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500"
                        />
                        <ArrowRight size={14} className="text-gray-500" />
                        <select
                            value={newBindingAgent}
                            onChange={(e) => setNewBindingAgent(e.target.value)}
                            className="bg-kamino-800 border border-kamino-700 rounded px-2 py-1.5 text-sm text-white"
                        >
                            <option value="">Select Agent</option>
                            {data.agents.map(a => (
                                <option key={a.id} value={a.id}>{a.id}</option>
                            ))}
                            <option value="main">main</option>
                            <option value="admin">admin</option>
                            <option value="security">security</option>
                            <option value="demo">demo</option>
                            <option value="guest">guest</option>
                        </select>
                        <button
                            onClick={addBinding}
                            disabled={!newBindingAgent || !newBindingPeer}
                            className="flex items-center gap-1 px-3 py-1.5 bg-kamino-accent hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white text-sm"
                        >
                            <Plus size={14} /> Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Route Flow Visual */}
            <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Routing Flow</h3>
                <div className="flex items-center gap-4 text-sm">
                    <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                        📱 Incoming Message
                    </div>
                    <ArrowRight size={16} className="text-gray-500" />
                    <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400">
                        🔀 Match Bindings
                    </div>
                    <ArrowRight size={16} className="text-gray-500" />
                    <div className="px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                        🤖 Agent ({data.bindings.length} rules)
                    </div>
                    <ArrowRight size={16} className="text-gray-500" />
                    <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
                        💬 Response
                    </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                    Unmatched messages go to: <span className="text-white font-mono">{data.defaultAgent}</span> agent
                </div>
            </div>
        </div>
    )
}
