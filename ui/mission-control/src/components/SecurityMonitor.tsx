import { Shield, AlertTriangle, Server, Activity, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API_BASE_URL, API_KEY } from '../config/api'

interface SecurityEvent {
    timestamp: string
    type: string
    severity: 'low' | 'warning' | 'high' | 'critical'
    source: string
    description: string
}

interface OpenPort {
    port: string
    protocol: string
    address: string
    service: string
}

interface SecurityStats {
    failedLogins: number
    bannedIPs: number
    securityEvents: number
    openPorts: number
}

export default function SecurityMonitor() {
    const [events, setEvents] = useState<SecurityEvent[]>([])
    const [ports, setPorts] = useState<OpenPort[]>([])
    const [stats, setStats] = useState<SecurityStats>({ failedLogins: 0, bannedIPs: 0, securityEvents: 0, openPorts: 0 })
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')

    const fetchData = async () => {
        setLoading(true)
        try {
            const [eventsRes, portsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/security/events?key=${API_KEY}`),
                fetch(`${API_BASE_URL}/api/security/ports?key=${API_KEY}`),
                fetch(`${API_BASE_URL}/api/security/stats?key=${API_KEY}`)
            ])

            if (eventsRes.ok) {
                const data = await eventsRes.json()
                setEvents(data.events || [])
            }

            if (portsRes.ok) {
                const data = await portsRes.json()
                setPorts(data.ports || [])
            }

            if (statsRes.ok) {
                const data = await statsRes.json()
                setStats({ ...data, openPorts: data.openPorts || ports.length })
            }
        } catch (error) {
            console.error('Failed to fetch security data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [])

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-400 bg-red-500/10'
            case 'high': return 'text-orange-400 bg-orange-500/10'
            case 'warning': return 'text-yellow-400 bg-yellow-500/10'
            default: return 'text-blue-400 bg-blue-500/10'
        }
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
            case 'high':
                return '🚨'
            case 'warning':
                return '⚠️'
            default:
                return 'ℹ️'
        }
    }

    const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter || e.severity === filter)

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-kamino-accent" />
                        Security Monitoring
                    </h1>
                    <p className="text-kamino-300 mt-1">Real-time security events and system monitoring</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="px-4 py-2 bg-kamino-700 hover:bg-kamino-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-kamino-800 border border-kamino-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-kamino-300 text-sm">Failed Logins</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.failedLogins}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>

                <div className="bg-kamino-800 border border-kamino-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-kamino-300 text-sm">Banned IPs</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.bannedIPs}</p>
                        </div>
                        <Shield className="w-8 h-8 text-red-400" />
                    </div>
                </div>

                <div className="bg-kamino-800 border border-kamino-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-kamino-300 text-sm">Security Events</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.securityEvents}</p>
                        </div>
                        <Activity className="w-8 h-8 text-kamino-accent" />
                    </div>
                </div>

                <div className="bg-kamino-800 border border-kamino-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-kamino-300 text-sm">Open Ports</p>
                            <p className="text-2xl font-bold text-white mt-1">{ports.length}</p>
                        </div>
                        <Server className="w-8 h-8 text-green-400" />
                    </div>
                </div>
            </div>

            {/* Open Ports */}
            <div className="bg-kamino-800 border border-kamino-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Server className="w-5 h-5 text-green-400" />
                    Open Ports
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ports.map((port, i) => (
                        <div key={i} className="bg-kamino-900 border border-kamino-600 rounded p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-mono text-lg">{port.port}</p>
                                    <p className="text-kamino-300 text-sm">{port.service}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-kamino-400 text-xs">{port.protocol.toUpperCase()}</p>
                                    <p className="text-kamino-500 text-xs font-mono">{port.address}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security Events */}
            <div className="bg-kamino-800 border border-kamino-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-kamino-accent" />
                        Recent Security Events
                    </h2>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-kamino-700 text-white px-3 py-1.5 rounded border border-kamino-600 focus:outline-none focus:border-kamino-accent"
                    >
                        <option value="all">All Events</option>
                        <option value="failed_login">Failed Logins</option>
                        <option value="ip_banned">IP Bans</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="warning">Warnings</option>
                    </select>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredEvents.length === 0 ? (
                        <div className="text-center py-8 text-kamino-400">
                            {loading ? 'Loading events...' : 'No security events found'}
                        </div>
                    ) : (
                        filteredEvents.map((event, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-lg border ${getSeverityColor(event.severity)} border-opacity-20`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <span className="text-2xl">{getSeverityIcon(event.severity)}</span>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{event.description}</p>
                                            <div className="flex items-center gap-4 mt-1 text-sm">
                                                <span className="text-kamino-400">
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </span>
                                                <span className="text-kamino-400 font-mono">{event.source}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(event.severity)}`}>
                                                    {event.severity.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
