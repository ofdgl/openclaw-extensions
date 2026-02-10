import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, AlertTriangle, BarChart3 } from 'lucide-react'
import { API_BASE_URL, API_KEY } from '../config/api'

interface CostSummary {
    daily: { day: string; cost: number; tokens: number }[]
    weekly: { total: number; avg: number }
    lifetime: { total: number; days: number }
    models: { model: string; cost: number; percentage: number; tokens: number; color: string }[]
    sessions: { session: string; cost: number; requests: number }[]
}

interface HeatmapData {
    heatmap: number[][]
    days: string[]
}

export default function CostTracker() {
    const [summary, setSummary] = useState<CostSummary | null>(null)
    const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, heatmapRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/costs/summary?key=${API_KEY}`),
                    fetch(`${API_BASE_URL}/api/costs/heatmap?key=${API_KEY}`)
                ])

                if (summaryRes.ok) {
                    const data = await summaryRes.json()
                    setSummary(data)
                }

                if (heatmapRes.ok) {
                    const data = await heatmapRes.json()
                    setHeatmap(data)
                }
            } catch (error) {
                console.error('Failed to fetch cost data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 60000) // Refresh every minute
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="text-gray-400">Loading cost data...</div>
            </div>
        )
    }

    if (!summary) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">API Connection Failed</h2>
                    <p className="text-gray-400 mb-4">
                        Cannot fetch cost data from <code className="text-kamino-accent">{API_BASE_URL}</code>
                    </p>
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

    const dailyAvg = summary.weekly.avg
    const weeklyTotal = summary.weekly.total

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white">Cost & Token Tracker</h1>

            {/* Budget Status */}
            <div className="grid grid-cols-4 gap-4">
                <BudgetCard label="Bugün" value={summary.daily[summary.daily.length - 1]?.cost || 0} limit={5} hardLimit={8} />
                <BudgetCard label="Bu Hafta" value={weeklyTotal} limit={30} hardLimit={40} />
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Günlük Ortalama</div>
                    <div className="text-2xl font-bold text-white">${dailyAvg.toFixed(2)}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Lifetime</div>
                    <div className="text-2xl font-bold text-white">${summary.lifetime.total.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{summary.lifetime.days} gün</div>
                </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-kamino-accent" />
                    Haftalık Maliyet
                </h2>
                <div className="flex items-end gap-3 h-40">
                    {summary.daily.map((d, i) => {
                        const height = (d.cost / 8) * 100
                        const isOverSoft = d.cost > 5
                        const isOverHard = d.cost > 8
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs text-gray-400">${d.cost.toFixed(1)}</span>
                                <div
                                    className={`w-full rounded-t transition-all ${isOverHard ? 'bg-red-500' : isOverSoft ? 'bg-yellow-500' : 'bg-kamino-accent'
                                        }`}
                                    style={{ height: `${Math.min(height, 100)}%` }}
                                />
                                <span className="text-xs text-gray-500">{d.day}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-kamino-accent rounded" /> Normal
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded" /> Soft limit ($5)
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded" /> Hard limit ($8)
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Model Breakdown */}
                <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                    <h2 className="font-semibold text-white mb-4">Model Dağılımı</h2>
                    <div className="space-y-3">
                        {summary.models.map((m, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-300">{m.model}</span>
                                    <span className="text-gray-400">
                                        {m.cost > 0 ? `$${m.cost.toFixed(2)}` : 'Free'} • {(m.tokens / 1000).toFixed(0)}K tok
                                    </span>
                                </div>
                                <div className="h-2 bg-kamino-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Sessions by Cost */}
                <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                    <h2 className="font-semibold text-white mb-4">Session Maliyetleri</h2>
                    <div className="space-y-3">
                        {summary.sessions.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-kamino-700/50 rounded-lg">
                                <div>
                                    <div className="text-white font-medium">{s.session}</div>
                                    <div className="text-xs text-gray-500">{s.requests} request</div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold ${s.cost > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                        {s.cost > 0 ? `$${s.cost.toFixed(2)}` : 'Free'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Activity Heatmap */}
            {heatmap && (
                <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                    <h2 className="font-semibold text-white mb-4">Aktivite Heatmap (Token Kullanımı)</h2>
                    <div className="space-y-1">
                        {heatmap.heatmap.map((row, dayIdx) => (
                            <div key={dayIdx} className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 w-8">{heatmap.days[dayIdx]}</span>
                                {row.map((val, hourIdx) => (
                                    <div
                                        key={hourIdx}
                                        className="w-3 h-3 rounded-sm"
                                        style={{
                                            backgroundColor: val === 0 ? '#1f2937' : `rgba(59, 130, 246, ${Math.min(val / 100, 1)})`,
                                        }}
                                        title={`${heatmap.days[dayIdx]} ${hourIdx}:00 - ${val} tokens`}
                                    />
                                ))}
                            </div>
                        ))}
                        <div className="flex items-center gap-1 ml-8 mt-2">
                            {[0, 6, 12, 18, 23].map(h => (
                                <span key={h} className="text-[10px] text-gray-600" style={{ marginLeft: h === 0 ? 0 : `${(h - (h > 0 ? [0, 6, 12, 18][Math.floor(h / 6) - 1] || 0 : 0)) * 16 - 16}px` }}>
                                    {h}:00
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function BudgetCard({ label, value, limit, hardLimit }: {
    label: string; value: number; limit: number; hardLimit: number
}) {
    const pct = (value / hardLimit) * 100
    const isWarn = value >= limit
    const isDanger = value >= hardLimit

    return (
        <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{label}</span>
                {isWarn && (
                    <AlertTriangle size={14} className={isDanger ? 'text-red-500' : 'text-yellow-500'} />
                )}
            </div>
            <div className={`text-2xl font-bold ${isDanger ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-white'}`}>
                ${value.toFixed(2)}
            </div>
            <div className="h-1.5 bg-kamino-700 rounded-full overflow-hidden mt-2">
                <div
                    className={`h-full rounded-full ${isDanger ? 'bg-red-500' : isWarn ? 'bg-yellow-500' : 'bg-kamino-accent'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
            <div className="text-xs text-gray-500 mt-1">${limit} soft / ${hardLimit} hard</div>
        </div>
    )
}
