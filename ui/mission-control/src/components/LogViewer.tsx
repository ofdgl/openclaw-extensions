import { ScrollText, Filter, Download, AlertCircle } from 'lucide-react'
import { useState } from 'react'

const logSources = ['gateway', 'security', 'hooks', 'agent-errors']
const logLevels = ['all', 'info', 'warn', 'error']

const logs = [
    { time: '18:30:45', source: 'gateway', level: 'info', message: 'Message received from +905357874261' },
    { time: '18:30:44', source: 'hooks', level: 'info', message: '[router-guard] Routed to main-agent' },
    { time: '18:30:43', source: 'hooks', level: 'info', message: '[billing-tracker] Logged 1250 input + 890 output tokens' },
    { time: '18:25:11', source: 'security', level: 'warn', message: '[secret-guard] Redacted API key from response' },
    { time: '18:20:33', source: 'gateway', level: 'info', message: 'Session started: main-agent' },
    { time: '18:15:22', source: 'hooks', level: 'info', message: '[router-guard] Routed to guest-agent' },
    { time: '18:10:11', source: 'hooks', level: 'warn', message: '[loop-detector] Loop iteration 2/3 detected' },
    { time: '18:05:00', source: 'security', level: 'error', message: '[fail2ban] Blocked IP 192.168.1.100 after 5 failed attempts' },
    { time: '17:55:18', source: 'agent-errors', level: 'error', message: 'Coder agent: Module not found error' },
    { time: '17:50:33', source: 'gateway', level: 'info', message: 'Heartbeat check passed' },
]

export default function LogViewer() {
    const [sourceFilter, setSourceFilter] = useState<string>('all')
    const [levelFilter, setLevelFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const filtered = logs.filter(log => {
        const matchesSource = sourceFilter === 'all' || log.source === sourceFilter
        const matchesLevel = levelFilter === 'all' || log.level === levelFilter
        const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSource && matchesLevel && matchesSearch
    })

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Log Viewer</h1>
                <button className="flex items-center gap-2 px-3 py-2 bg-kamino-700 rounded-lg text-sm text-gray-300 hover:bg-kamino-600">
                    <Download size={16} />
                    Export Logs
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kamino-accent"
                    />
                </div>
                <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="px-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white focus:outline-none focus:border-kamino-accent"
                >
                    <option value="all">All Sources</option>
                    {logSources.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="px-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white focus:outline-none focus:border-kamino-accent"
                >
                    <option value="all">All Levels</option>
                    {logLevels.filter(l => l !== 'all').map(l => (
                        <option key={l} value={l}>{l}</option>
                    ))}
                </select>
            </div>

            {/* Log Stream */}
            <div className="flex-1 bg-black rounded-lg border border-kamino-700 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 px-4 py-2 bg-kamino-800 border-b border-kamino-700">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-gray-400">Live Stream</span>
                    <span className="text-xs text-gray-600 ml-auto">{filtered.length} entries</span>
                </div>
                <div className="flex-1 overflow-auto font-mono text-xs p-4 space-y-1">
                    {filtered.map((log, i) => {
                        const levelColor = {
                            info: 'text-gray-400',
                            warn: 'text-yellow-400',
                            error: 'text-red-400',
                        }[log.level] || 'text-gray-400'

                        const sourceColor = {
                            gateway: 'text-blue-400',
                            security: 'text-red-400',
                            hooks: 'text-purple-400',
                            'agent-errors': 'text-orange-400',
                        }[log.source] || 'text-gray-400'

                        return (
                            <div key={i} className="flex gap-3">
                                <span className="text-gray-600 shrink-0">{log.time}</span>
                                <span className={`${sourceColor} w-24 shrink-0`}>{log.source}</span>
                                <span className={`${levelColor} w-12 shrink-0 uppercase`}>{log.level}</span>
                                <span className="text-green-400">{log.message}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                <div className="bg-kamino-800 rounded-lg p-3 border border-kamino-700">
                    <div className="text-xs text-gray-500">Info</div>
                    <div className="text-xl font-bold text-gray-400">{logs.filter(l => l.level === 'info').length}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-3 border border-kamino-700">
                    <div className="text-xs text-gray-500">Warnings</div>
                    <div className="text-xl font-bold text-yellow-400">{logs.filter(l => l.level === 'warn').length}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-3 border border-kamino-700">
                    <div className="text-xs text-gray-500">Errors</div>
                    <div className="text-xl font-bold text-red-400">{logs.filter(l => l.level === 'error').length}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-3 border border-kamino-700 flex items-center justify-center">
                    <AlertCircle size={16} className="text-gray-600 mr-2" />
                    <span className="text-xs text-gray-500">Real-time monitoring</span>
                </div>
            </div>
        </div>
    )
}
