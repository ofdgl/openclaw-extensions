import { Search, Filter, MessageSquare, Eye, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { Page } from '../App'

interface SessionManagerProps {
    onNavigate?: (page: Page) => void
    initialSessionId?: string | null
}

// Enhanced session data with detailed stats
const sessions = [
    {
        id: 'main-omer-wa',
        user: 'Ömer',
        phone: '+905357874261',
        channel: 'whatsapp',
        category: 'admin',
        agent: 'main-agent',
        model: 'claude-sonnet-4-5',
        status: 'active',
        totalMessages: 245,
        inputMessages: 123,
        outputMessages: 122,
        apiRequests: 189,
        totalTokens: 189400,
        totalCost: 4.82,
        last24hInput: 12,
        last24hOutput: 12,
        startedAt: '2026-02-05 14:30',
        lastActivity: '2 min ago',
    },
    {
        id: 'guest-ekrem',
        user: 'Ekrem',
        phone: '+905070364656',
        channel: 'whatsapp',
        category: 'trusted',
        agent: 'guest-agent',
        model: 'gemini-2.0-flash',
        status: 'active',
        totalMessages: 45,
        inputMessages: 23,
        outputMessages: 22,
        apiRequests: 23,
        totalTokens: 12400,
        totalCost: 0.00,
        last24hInput: 3,
        last24hOutput: 3,
        startedAt: '2026-02-10 16:10',
        lastActivity: '15 min ago',
    },
    {
        id: 'guest-furkan',
        user: 'Furkan',
        phone: '+905306310567',
        channel: 'whatsapp',
        category: 'guest',
        agent: 'guest-agent',
        model: 'openrouter/llama-3.2',
        status: 'idle',
        totalMessages: 18,
        inputMessages: 9,
        outputMessages: 9,
        apiRequests: 9,
        totalTokens: 3200,
        totalCost: 0.00,
        last24hInput: 0,
        last24hOutput: 0,
        startedAt: '2026-02-10 15:45',
        lastActivity: '3 hours ago',
    },
    {
        id: 'main-omer-tg',
        user: 'Ömer',
        phone: 'telegram:omerfaruk',
        channel: 'telegram',
        category: 'admin',
        agent: 'main-agent',
        model: 'claude-sonnet-4-5',
        status: 'active',
        totalMessages: 89,
        inputMessages: 45,
        outputMessages: 44,
        apiRequests: 67,
        totalTokens: 78900,
        totalCost: 1.98,
        last24hInput: 5,
        last24hOutput: 5,
        startedAt: '2026-02-09 09:00',
        lastActivity: '1 hour ago',
    },
]

// Chat conversation with thinking logs
const chatMessages = [
    {
        role: 'user',
        content: 'Bugün neler yaptık?',
        time: '18:15',
        model: null,
        tokens: { input: 12, output: 0, tool: 0 },
        cost: 0
    },
    {
        role: 'assistant',
        content: 'Bugün şu işleri tamamladık:\n1. Playwright kurulumu\n2. Free model testi\n3. SOUL.md admin fix\n4. Kamino UI geliştirmeye başladık',
        time: '18:15',
        model: 'claude-sonnet-4-5',
        tokens: { input: 1250, output: 145, tool: 340 },
        cost: 0.0089,
        thinking: '# Thinking Process\n\n## Context Analysis\nUser sorgusu bugünkü aktiviteleri kapsıyor. Memory ve task.md dosyalarını kontrol etmeliyim.\n\n## Action Plan\n1. list_dir ile today\'s memory check\n2. view_file task.md\n3. Özet oluştur\n\n## Result\n4 major task completed today.',
        toolCalls: [
            { name: 'list_dir', input: '~/.openclaw/memory/', output: '2026-02-10.md ...' },
            { name: 'view_file', input: 'task.md', output: '[x] Playwright...' },
        ]
    },
    {
        role: 'user',
        content: 'Cost tracker\'ı göster',
        time: '18:20',
        model: null,
        tokens: { input: 8, output: 0, tool: 0 },
        cost: 0
    },
    {
        role: 'assistant',
        content: 'Bugünkü token kullanımı:\n- Toplam: 145,890 token\n- Maliyet: $2.34\n- Model dağılımı: %65 Claude, %20 Gemini (free), %15 diğer',
        time: '18:20',
        model: 'claude-sonnet-4-5',
        tokens: { input: 890, output: 89, tool: 120 },
        cost: 0.0067,
        thinking: '# Cost Calculation\n\n## Data Sources\n1. Billing tracker logs\n2. Session manager stats\n\n## Breakdown\n- Claude Sonnet: $1.52 (65%)\n- Gemini Flash: $0.00 (20%)\n- Others: $0.82 (15%)',
        toolCalls: [
            { name: 'grep_search', input: 'billing-tracker', output: 'Found 234 entries...' },
        ]
    },
]

export default function SessionManager({ onNavigate, initialSessionId }: SessionManagerProps = {}) {
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [sortBy, setSortBy] = useState<'activity' | 'cost' | 'messages'>('activity')
    const [selectedSession, setSelectedSession] = useState<string | null>(initialSessionId || null)
    const [expandedMessage, setExpandedMessage] = useState<number | null>(null)

    const filteredSessions = sessions
        .filter(s => {
            const matchesSearch = s.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.phone.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter
            return matchesSearch && matchesCategory
        })
        .sort((a, b) => {
            if (sortBy === 'cost') return b.totalCost - a.totalCost
            if (sortBy === 'messages') return b.totalMessages - a.totalMessages
            return 0 // activity default
        })

    const selected = sessions.find(s => s.id === selectedSession)

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Session Manager</h1>
                {selectedSession && (
                    <button
                        onClick={() => setSelectedSession(null)}
                        className="flex items-center gap-2 px-3 py-2 bg-kamino-700 rounded-lg text-sm text-gray-300 hover:bg-kamino-600"
                    >
                        <X size={16} /> Close Chat
                    </button>
                )}
            </div>

            {!selectedSession ? (
                <>
                    {/* Filters */}
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by user or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kamino-accent"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white focus:outline-none focus:border-kamino-accent"
                        >
                            <option value="all">All Categories</option>
                            <option value="admin">Admin</option>
                            <option value="trusted">Trusted</option>
                            <option value="guest">Guest</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white focus:outline-none focus:border-kamino-accent"
                        >
                            <option value="activity">Sort: Recent Activity</option>
                            <option value="cost">Sort: Cost</option>
                            <option value="messages">Sort: Messages</option>
                        </select>
                    </div>

                    {/* Sessions Table */}
                    <div className="flex-1 bg-kamino-800 rounded-lg border border-kamino-700 overflow-auto">
                        <table className="w-full">
                            <thead className="bg-kamino-700 sticky top-0">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">User</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Channel</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Category</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Messages (I/O)</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">API Requests</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Tokens</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Cost</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">24h (I/O)</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Agent → Model</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-kamino-700">
                                {filteredSessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-kamino-700/50">
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-white font-medium">{session.user}</div>
                                            <div className="text-xs text-gray-500">{session.phone}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded ${session.channel === 'whatsapp' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {session.channel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded ${session.category === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                    session.category === 'trusted' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {session.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-white">
                                            {session.totalMessages}
                                            <span className="text-xs text-gray-500 ml-1">
                                                ({session.inputMessages}/{session.outputMessages})
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-purple-400">{session.apiRequests}</td>
                                        <td className="px-4 py-3 text-sm text-right text-blue-400">{(session.totalTokens / 1000).toFixed(1)}K</td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className={session.totalCost > 0 ? 'text-orange-400' : 'text-green-400'}>
                                                {session.totalCost > 0 ? `$${session.totalCost.toFixed(2)}` : 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-400">
                                            {session.last24hInput + session.last24hOutput}
                                            <span className="text-xs text-gray-600 ml-1">
                                                ({session.last24hInput}/{session.last24hOutput})
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs text-blue-400">{session.agent}</div>
                                            <div className="text-xs text-purple-400">{session.model}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setSelectedSession(session.id)}
                                                className="px-3 py-1.5 bg-kamino-accent rounded text-xs text-white hover:bg-blue-600 flex items-center gap-1 ml-auto"
                                            >
                                                <MessageSquare size={12} /> View Chat
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                /* Chat View */
                <div className="flex-1 bg-kamino-800 rounded-lg border border-kamino-700 flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-kamino-700">
                        <div className="font-semibold text-white text-lg">{selected?.user} ({selected?.phone})</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {selected?.agent} • {selected?.model} • Started: {selected?.startedAt}
                        </div>
                        <div className="flex gap-4 text-xs text-gray-400 mt-2">
                            <span>Total: {selected?.totalMessages} messages</span>
                            <span>Tokens: {((selected?.totalTokens || 0) / 1000).toFixed(1)}K</span>
                            <span>Cost: {selected?.totalCost && selected.totalCost > 0 ? `$${selected.totalCost.toFixed(4)}` : 'Free'}</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {chatMessages.map((msg, i) => (
                            <div key={i}>
                                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-2xl px-4 py-2 rounded-lg ${msg.role === 'user'
                                            ? 'bg-kamino-accent text-white'
                                            : 'bg-kamino-700 text-gray-200'
                                        }`}>
                                        <div className="text-sm whitespace-pre-line">{msg.content}</div>
                                        <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
                                            <span>{msg.time}</span>
                                            {msg.role === 'assistant' && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-orange-400">
                                                        {msg.tokens.input + msg.tokens.output + msg.tokens.tool} tok • ${msg.cost.toFixed(4)}
                                                    </span>
                                                    {msg.thinking && (
                                                        <button
                                                            onClick={() => setExpandedMessage(expandedMessage === i ? null : i)}
                                                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                                        >
                                                            {expandedMessage === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                            Details
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {msg.role === 'assistant' && expandedMessage === i && (
                                    <div className="mt-2 ml-4 p-3 bg-kamino-900 rounded-lg border border-kamino-600 text-xs">
                                        <div className="grid grid-cols-3 gap-3 mb-3 pb-3 border-b border-kamino-700">
                                            <div>
                                                <span className="text-gray-500">Model:</span>
                                                <span className="text-purple-400 ml-2">{msg.model}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Input:</span>
                                                <span className="text-blue-400 ml-2">{msg.tokens.input}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Output:</span>
                                                <span className="text-purple-400 ml-2">{msg.tokens.output}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Tool:</span>
                                                <span className="text-yellow-400 ml-2">{msg.tokens.tool}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Total:</span>
                                                <span className="text-white ml-2">{msg.tokens.input + msg.tokens.output + msg.tokens.tool}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Cost:</span>
                                                <span className="text-orange-400 ml-2">${msg.cost.toFixed(4)}</span>
                                            </div>
                                        </div>
                                        {msg.thinking && (
                                            <div className="mb-3">
                                                <div className="text-gray-500 mb-1 font-semibold">Thinking Process:</div>
                                                <pre className="text-gray-400 whitespace-pre-wrap font-mono text-[10px] bg-black/30 p-2 rounded">
                                                    {msg.thinking}
                                                </pre>
                                            </div>
                                        )}
                                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                                            <div>
                                                <div className="text-gray-500 mb-1 font-semibold">Tool Calls ({msg.toolCalls.length}):</div>
                                                <div className="space-y-2">
                                                    {msg.toolCalls.map((tool, ti) => (
                                                        <div key={ti} className="bg-black/30 p-2 rounded">
                                                            <div className="text-yellow-400 mb-1">{tool.name}</div>
                                                            <div className="text-gray-500 text-[10px]">Input: {tool.input}</div>
                                                            <div className="text-gray-500 text-[10px]">Output: {tool.output}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
