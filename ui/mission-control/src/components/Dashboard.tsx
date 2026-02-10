import { Activity, Users, Cpu, HardDrive, Zap, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API_BASE_URL, API_KEY } from '../config/api'

interface DashboardStats {
    today: {
        totalTokens: number
        totalCost: number
        requestCount: number
    }
    system: {
        cpu: string
        ram: string
        uptime: number
    }
    agents: Array<{
        id: string
        status: string
        sessions: number
    }>
}

interface ActivityItem {
    time: string
    user: string
    action: string
    tokens: number
    cost: number
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, activityRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/dashboard/stats?key=${API_KEY}`),
                    fetch(`${API_BASE_URL}/api/dashboard/activity?key=${API_KEY}`)
                ])

                if (statsRes.ok) {
                    const statsData = await statsRes.json()
                    setStats(statsData)
                }

                if (activityRes.ok) {
                    const activityData = await activityRes.json()
                    setActivity(activityData.activity)
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="text-gray-400">Loading dashboard...</div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">API Connection Failed</h2>
                    <p className="text-gray-400 mb-4">
                        Cannot connect to backend API at <code className="text-kamino-accent">{API_BASE_URL}</code>
                    </p>
                    <div className="bg-kamino-800 border border-kamino-700 rounded-lg p-4 text-left">
                        <p className="text-sm text-gray-300 mb-2"><strong>Possible causes:</strong></p>
                        <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                            <li>API server is not running on port 3001</li>
                            <li>Network/firewall blocking connection</li>
                            <li>Invalid API key configuration</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-kamino-accent rounded-lg text-white hover:bg-blue-600"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        )
    }

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
                    value={stats.agents.filter(a => a.status === 'active').reduce((sum, a) => sum + a.sessions, 0)}
                    color="blue"
                />
                <StatCard
                    icon={<Zap size={20} />}
                    label="Bugünkü Tokens"
                    value={stats.today.totalTokens.toLocaleString()}
                    color="purple"
                />
                <StatCard
                    icon={<Activity size={20} />}
                    label="Toplam Requests"
                    value={stats.today.requestCount}
                    color="green"
                />
                <StatCard
                    icon={<MessageSquare size={20} />}
                    label="Bugünkü Maliyet"
                    value={`$${stats.today.totalCost.toFixed(4)}`}
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
                            style={{ width: `${stats.system.cpu}%` }}
                        />
                    </div>
                    <div className="text-right text-sm text-gray-400 mt-1">{stats.system.cpu}%</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="flex items-center gap-2 mb-3">
                        <HardDrive size={18} className="text-purple-500" />
                        <span className="text-gray-300">Memory Usage</span>
                    </div>
                    <div className="relative h-2 bg-kamino-700 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${stats.system.ram}%` }}
                        />
                    </div>
                    <div className="text-right text-sm text-gray-400 mt-1">{stats.system.ram}%</div>
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
                        {stats.agents.map((agent) => (
                            <div key={agent.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-white">{agent.id}</div>
                                    <div className="text-xs text-gray-500">{agent.sessions} sessions</div>
                                </div>
                                <div className="text-right">
                                    <StatusBadge status={agent.status} />
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
                        {activity.map((item, i) => (
                            <div key={i} className="p-3 flex items-center gap-3">
                                <div className="text-xs text-gray-500 w-12">{new Date(item.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="flex-1">
                                    <div className="text-sm text-white truncate">{item.action}</div>
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
