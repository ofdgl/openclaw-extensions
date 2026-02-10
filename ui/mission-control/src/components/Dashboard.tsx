import { Activity, Users, Cpu, HardDrive, Zap, MessageSquare } from 'lucide-react'

// Mock data - will be replaced with real API calls
const stats = {
    activeSessions: 3,
    totalRequests: 1247,
    tokensToday: 145890,
    costToday: 2.34,
    cpuUsage: 12,
    memoryUsage: 34,
}

const agents = [
    { name: 'Main Agent', status: 'active', model: 'claude-sonnet-4-5', lastActivity: '2 min ago' },
    { name: 'Guest Agent', status: 'idle', model: 'gemini-2.0-flash', lastActivity: '15 min ago' },
    { name: 'Coder Agent', status: 'blocked', model: 'claude-sonnet-4-5', lastActivity: '1 hour ago' },
]

const recentActivity = [
    { time: '18:20', user: '+905357874261', message: 'Token logs talep edildi', tokens: 45 },
    { time: '18:15', user: '+905070364656', message: 'Merhaba', tokens: 120 },
    { time: '18:10', user: '+905357874261', message: 'Mode switch komutu', tokens: 89 },
    { time: '18:05', user: 'System', message: 'Gateway restart', tokens: 0 },
]

export default function Dashboard() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <div className="text-sm text-gray-400">Son güncelleme: şimdi</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users size={20} />}
                    label="Aktif Sessions"
                    value={stats.activeSessions}
                    color="blue"
                />
                <StatCard
                    icon={<Zap size={20} />}
                    label="Bugünkü Tokens"
                    value={stats.tokensToday.toLocaleString()}
                    color="purple"
                />
                <StatCard
                    icon={<Activity size={20} />}
                    label="Toplam Requests"
                    value={stats.totalRequests}
                    color="green"
                />
                <StatCard
                    icon={<MessageSquare size={20} />}
                    label="Bugünkü Maliyet"
                    value={`$${stats.costToday}`}
                    color="yellow"
                />
            </div>

            {/* System Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="flex items-center gap-2 mb-3">
                        <Cpu size={18} className="text-kamino-accent" />
                        <span className="text-gray-300">CPU Usage</span>
                    </div>
                    <div className="relative h-2 bg-kamino-700 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-kamino-accent rounded-full transition-all"
                            style={{ width: `${stats.cpuUsage}%` }}
                        />
                    </div>
                    <div className="text-right text-sm text-gray-400 mt-1">{stats.cpuUsage}%</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="flex items-center gap-2 mb-3">
                        <HardDrive size={18} className="text-purple-500" />
                        <span className="text-gray-300">Memory Usage</span>
                    </div>
                    <div className="relative h-2 bg-kamino-700 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${stats.memoryUsage}%` }}
                        />
                    </div>
                    <div className="text-right text-sm text-gray-400 mt-1">{stats.memoryUsage}%</div>
                </div>
            </div>

            {/* Agents & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agents */}
                <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                    <div className="p-4 border-b border-kamino-700">
                        <h2 className="font-semibold text-white">Agents</h2>
                    </div>
                    <div className="divide-y divide-kamino-700">
                        {agents.map((agent, i) => (
                            <div key={i} className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-white">{agent.name}</div>
                                    <div className="text-xs text-gray-500">{agent.model}</div>
                                </div>
                                <div className="text-right">
                                    <StatusBadge status={agent.status} />
                                    <div className="text-xs text-gray-500 mt-1">{agent.lastActivity}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                    <div className="p-4 border-b border-kamino-700">
                        <h2 className="font-semibold text-white">Son Aktivite</h2>
                    </div>
                    <div className="divide-y divide-kamino-700 max-h-64 overflow-auto">
                        {recentActivity.map((item, i) => (
                            <div key={i} className="p-3 flex items-center gap-3">
                                <div className="text-xs text-gray-500 w-12">{item.time}</div>
                                <div className="flex-1">
                                    <div className="text-sm text-white truncate">{item.message}</div>
                                    <div className="text-xs text-gray-500">{item.user}</div>
                                </div>
                                {item.tokens > 0 && (
                                    <div className="text-xs text-purple-400">{item.tokens} tok</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode
    label: string
    value: string | number
    color: 'blue' | 'purple' | 'green' | 'yellow'
}) {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-500',
        purple: 'bg-purple-500/10 text-purple-500',
        green: 'bg-green-500/10 text-green-500',
        yellow: 'bg-yellow-500/10 text-yellow-500',
    }

    return (
        <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
            <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-3`}>
                {icon}
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const classes = {
        active: 'bg-green-500/20 text-green-400',
        idle: 'bg-gray-500/20 text-gray-400',
        blocked: 'bg-red-500/20 text-red-400',
    }[status] || 'bg-gray-500/20 text-gray-400'

    return (
        <span className={`text-xs px-2 py-1 rounded-full ${classes}`}>
            {status}
        </span>
    )
}
