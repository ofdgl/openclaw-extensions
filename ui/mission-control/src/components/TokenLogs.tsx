import { Search, Filter, Download, Wrench, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import type { Page } from '../App'

interface TokenLogsProps {
    onNavigate?: (page: Page, sessionId?: string) => void
}

// Mock token log data with tool usage
const tokenLogs = [
    {
        id: 1,
        time: '18:20:45',
        user: 'Ömer (+905357874261)',
        sessionId: 'main-omer',
        message: 'Token logs talep edildi',
        model: 'claude-sonnet-4-5',
        session: 'main-agent',
        inputTokens: 1250,
        outputTokens: 890,
        toolTokens: 340,
        totalTokens: 2480,
        retries: 1,
        toolCalls: 3,
        tools: ['list_dir', 'view_file', 'grep_search'],
        cost: 0.0156
    },
    {
        id: 2,
        time: '18:15:22',
        user: 'Ekrem (+905070364656)',
        sessionId: 'guest-ekrem',
        message: 'Merhaba, bugün hava nasıl?',
        model: 'gemini-2.0-flash',
        session: 'guest-agent',
        inputTokens: 45,
        outputTokens: 120,
        toolTokens: 0,
        totalTokens: 165,
        retries: 1,
        toolCalls: 0,
        tools: [],
        cost: 0.0000
    },
    {
        id: 3,
        time: '18:10:11',
        user: 'Ömer (+905357874261)',
        sessionId: 'main-omer',
        message: 'Mode switch komutu çalıştır',
        model: 'claude-sonnet-4-5',
        session: 'main-agent',
        inputTokens: 890,
        outputTokens: 234,
        toolTokens: 560,
        totalTokens: 1684,
        retries: 2,
        toolCalls: 4,
        tools: ['run_command', 'send_command_input', 'command_status', 'view_file'],
        cost: 0.0089
    },
    {
        id: 4,
        time: '18:05:33',
        user: 'Furkan (+905306310567)',
        sessionId: 'guest-furkan',
        message: 'Dosya gönder',
        model: 'openrouter/llama-3.2',
        session: 'guest-agent',
        inputTokens: 230,
        outputTokens: 180,
        toolTokens: 0,
        totalTokens: 410,
        retries: 1,
        toolCalls: 0,
        tools: [],
        cost: 0.0000
    },
]

export default function TokenLogs({ onNavigate }: TokenLogsProps = {}) {
    const [searchQuery, setSearchQuery] = useState('')
    const [modelFilter, setModelFilter] = useState<string>('all')
    const [hoveredLog, setHoveredLog] = useState<number | null>(null)

    const filteredLogs = tokenLogs.filter(log => {
        const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesModel = modelFilter === 'all' || log.model.includes(modelFilter)
        return matchesSearch && matchesModel
    })

    const totalTokens = filteredLogs.reduce((sum, log) => sum + log.totalTokens, 0)
    const totalCost = filteredLogs.reduce((sum, log) => sum + log.cost, 0)
    const totalToolCalls = filteredLogs.reduce((sum, log) => sum + log.toolCalls, 0)

    const handleUserClick = (sessionId: string) => {
        if (onNavigate) {
            onNavigate('sessions', sessionId)
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Token & Message Logs</h1>
                <button className="flex items-center gap-2 px-3 py-2 bg-kamino-700 rounded-lg text-sm text-gray-300 hover:bg-kamino-600 transition-colors">
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Toplam Token</div>
                    <div className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Toplam Maliyet</div>
                    <div className="text-2xl font-bold text-green-400">${totalCost.toFixed(4)}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Request Sayısı</div>
                    <div className="text-2xl font-bold text-white">{filteredLogs.length}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Tool Calls</div>
                    <div className="text-2xl font-bold text-purple-400">{totalToolCalls}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Mesaj veya kullanıcı ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kamino-accent"
                    />
                </div>
                <div className="relative">
                    <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <select
                        value={modelFilter}
                        onChange={(e) => setModelFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white appearance-none focus:outline-none focus:border-kamino-accent"
                    >
                        <option value="all">Tüm Modeller</option>
                        <option value="claude">Claude</option>
                        <option value="gemini">Gemini</option>
                        <option value="openrouter">OpenRouter</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-kamino-800 rounded-lg border border-kamino-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-kamino-700">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Zaman</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Kullanıcı</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Mesaj</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Model</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Input</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Output</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Tools</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Total</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Maliyet</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-kamino-700">
                        {filteredLogs.map((log) => (
                            <tr
                                key={log.id}
                                className="hover:bg-kamino-700/50 relative"
                                onMouseEnter={() => setHoveredLog(log.id)}
                                onMouseLeave={() => setHoveredLog(null)}
                            >
                                <td className="px-4 py-3 text-sm text-gray-400">{log.time}</td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => handleUserClick(log.sessionId)}
                                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                    >
                                        {log.user}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{log.message}</td>
                                <td className="px-4 py-3">
                                    <ModelBadge model={log.model} />
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-blue-400">{log.inputTokens.toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-right text-purple-400">{log.outputTokens.toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-right">
                                    {log.toolCalls > 0 ? (
                                        <span className="text-yellow-400 flex items-center justify-end gap-1">
                                            <Wrench size={12} />
                                            {log.toolTokens} ({log.toolCalls})
                                        </span>
                                    ) : (
                                        <span className="text-gray-600">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-white">
                                    {log.totalTokens.toLocaleString()}
                                    {log.retries > 1 && (
                                        <span className="inline-flex items-center ml-1" title={`${log.retries} retries`}>
                                            <RotateCcw size={10} className="text-orange-400" />
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-green-400">
                                    {log.cost > 0 ? `$${log.cost.toFixed(4)}` : 'Free'}
                                </td>

                                {/* Hover Tooltip */}
                                {hoveredLog === log.id && (
                                    <div className="absolute right-0 top-full mt-1 z-10 bg-kamino-900 border border-kamino-600 rounded-lg p-3 shadow-xl w-64">
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Model:</span>
                                                <span className="text-white font-medium">{log.model}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Session:</span>
                                                <span className="text-white">{log.session}</span>
                                            </div>
                                            {log.retries > 1 && (
                                                <div className="flex justify-between text-orange-400">
                                                    <span>Retries:</span>
                                                    <span>{log.retries}</span>
                                                </div>
                                            )}
                                            {log.toolCalls > 0 && (
                                                <>
                                                    <div className="flex justify-between text-yellow-400">
                                                        <span>Tool Calls:</span>
                                                        <span>{log.toolCalls}</span>
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t border-kamino-700">
                                                        <div className="text-gray-500 mb-1">Tools Used:</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {log.tools.map((tool, i) => (
                                                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-kamino-800 text-purple-400 rounded">
                                                                    {tool}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function ModelBadge({ model }: { model: string }) {
    const getColorClass = () => {
        if (model.includes('claude')) return 'bg-orange-500/20 text-orange-400'
        if (model.includes('gemini')) return 'bg-blue-500/20 text-blue-400'
        if (model.includes('openrouter')) return 'bg-green-500/20 text-green-400'
        return 'bg-gray-500/20 text-gray-400'
    }

    const getShortName = () => {
        if (model.includes('claude')) return 'Claude'
        if (model.includes('gemini')) return 'Gemini'
        if (model.includes('openrouter')) return 'OpenRouter'
        return model
    }

    return (
        <span className={`text-xs px-2 py-1 rounded-full ${getColorClass()}`}>
            {getShortName()}
        </span>
    )
}
