import { TrendingUp, DollarSign, AlertTriangle, BarChart3 } from 'lucide-react'

// Mock daily cost data
const dailyCosts = [
    { day: 'Pzt', cost: 3.20, tokens: 98000 },
    { day: 'Sal', cost: 4.80, tokens: 145000 },
    { day: 'Çar', cost: 2.10, tokens: 67000 },
    { day: 'Per', cost: 6.50, tokens: 201000 },
    { day: 'Cum', cost: 1.90, tokens: 54000 },
    { day: 'Cmt', cost: 0.80, tokens: 23000 },
    { day: 'Paz', cost: 2.34, tokens: 72000 },
]

const modelBreakdown = [
    { model: 'Claude Sonnet', cost: 14.20, percentage: 65, tokens: 432000, color: 'bg-orange-500' },
    { model: 'Gemini Flash', cost: 0.00, percentage: 20, tokens: 128000, color: 'bg-blue-500' },
    { model: 'OpenRouter Free', cost: 0.00, percentage: 10, tokens: 64000, color: 'bg-green-500' },
    { model: 'Claude Haiku', cost: 1.20, percentage: 5, tokens: 36000, color: 'bg-purple-500' },
]

const topSessions = [
    { session: 'main-agent', cost: 12.40, requests: 89 },
    { session: 'coder-agent', cost: 2.80, requests: 23 },
    { session: 'guest-agent', cost: 0.00, requests: 145 },
]

// Mock heatmap data (24 hours x 7 days)
const heatmapData = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => Math.floor(Math.random() * 100))
)
const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function CostTracker() {
    const weeklyTotal = dailyCosts.reduce((s, d) => s + d.cost, 0)
    const dailyAvg = weeklyTotal / 7

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white">Cost & Token Tracker</h1>

            {/* Budget Status */}
            <div className="grid grid-cols-4 gap-4">
                <BudgetCard label="Bugün" value={2.34} limit={5} hardLimit={8} />
                <BudgetCard label="Bu Hafta" value={weeklyTotal} limit={30} hardLimit={40} />
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Günlük Ortalama</div>
                    <div className="text-2xl font-bold text-white">${dailyAvg.toFixed(2)}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Lifetime</div>
                    <div className="text-2xl font-bold text-white">$127.45</div>
                    <div className="text-xs text-gray-500">45 gün</div>
                </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-kamino-accent" />
                    Haftalık Maliyet
                </h2>
                <div className="flex items-end gap-3 h-40">
                    {dailyCosts.map((d, i) => {
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
                        {modelBreakdown.map((m, i) => (
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
                        {topSessions.map((s, i) => (
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
            <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                <h2 className="font-semibold text-white mb-4">Aktivite Heatmap (Token Kullanımı)</h2>
                <div className="space-y-1">
                    {heatmapData.map((row, dayIdx) => (
                        <div key={dayIdx} className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 w-8">{days[dayIdx]}</span>
                            {row.map((val, hourIdx) => (
                                <div
                                    key={hourIdx}
                                    className="w-3 h-3 rounded-sm"
                                    style={{
                                        backgroundColor: val === 0 ? '#1f2937' : `rgba(59, 130, 246, ${Math.min(val / 100, 1)})`,
                                    }}
                                    title={`${days[dayIdx]} ${hourIdx}:00 - ${val} tokens`}
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
