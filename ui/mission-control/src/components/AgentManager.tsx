import { Bot, MessageSquare, FolderOpen, X } from 'lucide-react'
import { useState } from 'react'

const agents = [
    {
        id: 'main-agent',
        name: 'Main Agent',
        role: 'Primary assistant for admin tasks',
        status: 'active',
        model: 'claude-sonnet-4-5',
        workspace: '~/.openclaw/workspace',
        uptime: '4h 23m',
        tokensToday: 89000,
        costToday: 2.34,
        currentTask: 'Kamino UI geliştirme',
        sessions: 2,
        outputs: [
            { time: '18:20', content: 'TokenLogs component enhanced with tool tracking...', tokens: 145, cost: 0.0012 },
            { time: '18:15', content: 'SessionManager redesigned with table view...', tokens: 234, cost: 0.0019 },
            { time: '17:55', content: 'Created HookManager with 20 hooks...', tokens: 189, cost: 0.0015 },
        ],
        memory: {
            soul: `# Main Agent - SOUL\n\nBen ana asistan. Ömer'in tüm işlerini yönetiyorum.\n\n## Rol\n- Full stack development\n- System administration\n- Cost optimization\n\n## Ton\nProfesyonel, proaktif, detaylı.`,
            daily: ['2026-02-10.md', '2026-02-09.md', '2026-02-08.md'],
        }
    },
    {
        id: 'guest-agent',
        name: 'Guest Agent',
        role: 'Handles messages from guests and trusted users',
        status: 'active',
        model: 'gemini-2.0-flash',
        workspace: '~/.openclaw/workspace-guest',
        uptime: '4h 23m',
        tokensToday: 4600,
        costToday: 0.00,
        currentTask: 'Responding to Ekrem',
        sessions: 3,
        outputs: [
            { time: '18:10', content: 'Hava durumu sorgusu cevaplandı...', tokens: 120, cost: 0.00 },
            { time: '17:45', content: 'Dosya gönderme talebi admin\'e yönlendirildi...', tokens: 89, cost: 0.00 },
        ],
        memory: {
            soul: `# Guest Agent - SOUL\n\nGuest ve trusted kullanıcılara hizmet veriyorum.\n\n## Rol\n- Basic Q&A\n- Message forwarding to admin\n- Rate limiting enforcement\n\n## Ton\nSamimi, yardımsever, sınırları bilen.`,
            daily: ['2026-02-10.md'],
        }
    },
    {
        id: 'coder-agent',
        name: 'Coder Agent',
        role: 'Code generation & review',
        status: 'idle',
        model: 'claude-sonnet-4-5',
        workspace: '~/.openclaw/workspace-intern',
        uptime: '0m',
        tokensToday: 0,
        costToday: 0,
        currentTask: 'Inactive',
        sessions: 0,
        outputs: [],
        memory: {
            soul: `# Coder Agent - SOUL\n\nKod yazımı ve review\'da uzmanım.\n\n## Rol\n- Code generation\n- Code review\n- Refactoring\n\n## Standartlar\n- TypeScript strict mode\n- Functional programming\n- Comprehensive tests`,
            daily: [],
        }
    },
    {
        id: 'admin-agent',
        name: 'Admin Agent',
        role: 'System administration & maintenance',
        status: 'idle',
        model: 'claude-haiku',
        workspace: '~/.openclaw/workspace-admin',
        uptime: '0m',
        tokensToday: 0,
        costToday: 0,
        currentTask: 'Inactive',
        sessions: 0,
        outputs: [],
        memory: {
            soul: `# Admin Agent - SOUL\n\nSistem yönetimi ve bakımdan sorumluyum.\n\n## Rol\n- Backup management\n- Log cleanup\n- Security scans\n\n## Prensipler\nOtomasyon, monitoring, proaktif müdahale.`,
            daily: [],
        }
    },
    {
        id: 'security-agent',
        name: 'Security Agent',
        role: 'Threat monitoring & reporting',
        status: 'idle',
        model: 'gemini-2.0-flash',
        workspace: '~/.openclaw/workspace-security',
        uptime: '0m',
        tokensToday: 0,
        costToday: 0,
        currentTask: 'Inactive',
        sessions: 0,
        outputs: [],
        memory: {
            soul: `# Security Agent - SOUL\n\nGüvenlik izleme ve raporlama.\n\n## Rol\n- Threat detection\n- Anomaly monitoring\n- Incident reporting\n\n## Approach\nParanoid, verification-first, zero-trust.`,
            daily: [],
        }
    },
]

export default function AgentManager() {
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
    const [view, setView] = useState<'outputs' | 'memory'>('outputs')

    const selected = agents.find(a => a.id === selectedAgent)

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Agent Management</h1>
                {selectedAgent && (
                    <button
                        onClick={() => setSelectedAgent(null)}
                        className="flex items-center gap-2 px-3 py-2 bg-kamino-700 rounded-lg text-sm text-gray-300 hover:bg-kamino-600"
                    >
                        <X size={16} /> Back to List
                    </button>
                )}
            </div>

            {!selectedAgent ? (
                /* Agent Grid */
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {agents.map((agent) => (
                        <button
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent.id)}
                            className="bg-kamino-800 rounded-lg border border-kamino-700 p-4 hover:border-kamino-accent transition-colors text-left"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${agent.status === 'active' ? 'bg-blue-500/20' : 'bg-gray-500/20'
                                        }`}>
                                        <Bot size={20} className={agent.status === 'active' ? 'text-blue-400' : 'text-gray-500'} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white">{agent.name}</div>
                                        <div className="text-xs text-gray-500">{agent.role}</div>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${agent.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {agent.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm mb-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Model</span>
                                    <span className="text-gray-300">{agent.model}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tokens (bugün)</span>
                                    <span className="text-gray-300">{(agent.tokensToday / 1000).toFixed(1)}K</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Maliyet</span>
                                    <span className={agent.costToday > 0 ? 'text-orange-400' : 'text-green-400'}>
                                        {agent.costToday > 0 ? `$${agent.costToday.toFixed(2)}` : 'Free'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Outputs</span>
                                    <span className="text-blue-400">{agent.outputs.length}</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-kamino-700 text-xs text-gray-400 truncate">
                                Task: {agent.currentTask}
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                /* Agent Detail View */
                <div className="flex-1 flex flex-col gap-4">
                    {/* Agent Header */}
                    <div className="bg-kamino-800 rounded-lg border border-kamino-700 p-4">
                        <div className="flex items-center gap-4 mb-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${selected?.status === 'active' ? 'bg-blue-500/20' : 'bg-gray-500/20'
                                }`}>
                                <Bot size={24} className={selected?.status === 'active' ? 'text-blue-400' : 'text-gray-500'} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-xl font-bold text-white">{selected?.name}</h2>
                                    <span className={`text-xs px-2 py-1 rounded-full ${selected?.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-400/20 text-gray-400'
                                        }`}>
                                        {selected?.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400">{selected?.role}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Model:</span>
                                <span className="text-purple-400 ml-2">{selected?.model}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Uptime:</span>
                                <span className="text-white ml-2">{selected?.uptime}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Tokens:</span>
                                <span className="text-blue-400 ml-2">{((selected?.tokensToday || 0) / 1000).toFixed(1)}K</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Cost:</span>
                                <span className={selected && selected.costToday > 0 ? 'text-orange-400 ml-2' : 'text-green-400 ml-2'}>
                                    {selected && selected.costToday > 0 ? `$${selected.costToday.toFixed(4)}` : 'Free'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* View Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('outputs')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'outputs'
                                    ? 'bg-kamino-accent text-white'
                                    : 'bg-kamino-800 text-gray-400 hover:text-white'
                                }`}
                        >
                            <MessageSquare size={16} className="inline mr-2" />
                            Outputs ({selected?.outputs.length || 0})
                        </button>
                        <button
                            onClick={() => setView('memory')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'memory'
                                    ? 'bg-kamino-accent text-white'
                                    : 'bg-kamino-800 text-gray-400 hover:text-white'
                                }`}
                        >
                            <FolderOpen size={16} className="inline mr-2" />
                            Memory
                        </button>
                    </div>

                    {/* Content */}
                    {view === 'outputs' ? (
                        <div className="flex-1 bg-kamino-800 rounded-lg border border-kamino-700 p-4 overflow-auto">
                            {selected && selected.outputs.length > 0 ? (
                                <div className="space-y-3">
                                    {selected.outputs.map((output, i) => (
                                        <div key={i} className="bg-kamino-700 rounded-lg p-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-xs text-gray-500">{output.time}</span>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="text-blue-400">{output.tokens} tokens</span>
                                                    <span className="text-orange-400">
                                                        {output.cost > 0 ? `$${output.cost.toFixed(4)}` : 'Free'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-200">{output.content}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                                        <p>No outputs yet</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 bg-kamino-800 rounded-lg border border-kamino-700 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-kamino-700">
                                <h3 className="font-semibold text-white">Agent-Specific Memory</h3>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <div className="mb-4">
                                    <div className="text-sm font-medium text-gray-400 mb-2">SOUL.md</div>
                                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-kamino-900 p-3 rounded">
                                        {selected?.memory.soul}
                                    </pre>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-400 mb-2">Daily Memory</div>
                                    <div className="space-y-1">
                                        {selected?.memory.daily.map((day, i) => (
                                            <div key={i} className="text-xs text-blue-400 hover:underline cursor-pointer">
                                                {day}
                                            </div>
                                        ))}
                                        {selected?.memory.daily.length === 0 && (
                                            <div className="text-xs text-gray-600">No daily memory files</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
