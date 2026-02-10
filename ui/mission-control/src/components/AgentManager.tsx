import { Users, Play, Pause, Activity } from 'lucide-react'
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
}

export default function AgentManager() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
    const [outputs, setOutputs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/agents?key=${API_KEY}`)
                if (res.ok) {
                    const data = await res.json()
                    setAgents(data.agents)
                }
            } catch (e) {
                console.error('Failed to fetch agents:', e)
            } finally {
                setLoading(false)
            }
        }

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

    if (loading) {
        return <div className="p-6 text-gray-400">Loading agents...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white">Agent Management</h1>

            <div className="grid grid-cols-3 gap-4">
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
                        <div className="space-y-1 text-sm text-gray-400">
                            <div>Model: <span className="text-white">{agent.model}</span></div>
                            <div>Sessions: <span className="text-white">{agent.sessions}</span></div>
                            <div>Outputs: <span className="text-white">{agent.outputs}</span></div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedAgent && (
                <div className="bg-kamino-800 rounded-lg border border-kamino-700 p-6">
                    <h2 className="font-semibold text-white mb-4">Recent Outputs</h2>
                    <div className="space-y-3">
                        {outputs.map((output) => (
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
                        ))}
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
