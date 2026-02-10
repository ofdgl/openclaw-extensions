import { Plug, Filter, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useState } from 'react'

const hooks = [
    { id: 'router-guard', name: 'Router Guard', category: 'routing', enabled: true, runs: 234, lastRun: '1 min ago', description: 'Route messages based on sender category (admin/trusted/guest)' },
    { id: 'rate-limiter', name: 'Rate Limiter', category: 'security', enabled: true, runs: 89, lastRun: '5 min ago', description: 'Limit messages per user per time window' },
    { id: 'model-fallback', name: 'Model Fallback', category: 'routing', enabled: true, runs: 12, lastRun: '2 hours ago', description: 'Auto-switch to cheaper model when budget exceeds or errors' },
    { id: 'billing-tracker', name: 'Billing Tracker', category: 'monitoring', enabled: true, runs: 450, lastRun: '1 min ago', description: 'Track token usage and cost per request' },
    { id: 'secret-guard', name: 'Secret Guard', category: 'security', enabled: true, runs: 450, lastRun: '1 min ago', description: 'Block sensitive data from leaking in responses' },
    { id: 'security-reporter', name: 'Security Reporter', category: 'security', enabled: true, runs: 23, lastRun: '1 hour ago', description: 'Report security events and suspicious activity' },
    { id: 'intent-classifier', name: 'Intent Classifier', category: 'routing', enabled: true, runs: 234, lastRun: '1 min ago', description: 'Classify message intent for routing decisions' },
    { id: 'handoff-manager', name: 'Handoff Manager', category: 'routing', enabled: false, runs: 5, lastRun: '1 day ago', description: 'Manage agent-to-agent task handoffs' },
    { id: 'loop-detector', name: 'Loop Detector', category: 'safety', enabled: true, runs: 45, lastRun: '30 min ago', description: 'Detect and break stuck agent loops after 3 attempts' },
    { id: 'contact-enricher', name: 'Contact Enricher', category: 'contacts', enabled: true, runs: 67, lastRun: '10 min ago', description: 'Enrich contact info on first message' },
    { id: 'mention-notifier', name: 'Mention Notifier', category: 'notification', enabled: false, runs: 0, lastRun: 'never', description: 'Notify admin when mentioned by other agents' },
    { id: 'vps-mode-switch', name: 'VPS Mode Switch', category: 'system', enabled: true, runs: 3, lastRun: '1 day ago', description: 'Handle Kamino ↔ Original mode switching' },
    { id: 'backup-automator', name: 'Backup Automator', category: 'system', enabled: true, runs: 14, lastRun: '6 hours ago', description: 'Auto-backup credentials and contacts daily' },
    { id: 'daily-standup', name: 'Daily Standup', category: 'scheduling', enabled: false, runs: 7, lastRun: '1 day ago', description: 'Send daily standup summary to admin' },
    { id: 'heartbeat-scheduler', name: 'Heartbeat Scheduler', category: 'monitoring', enabled: true, runs: 96, lastRun: '30 min ago', description: 'Periodic heartbeat check every 30 minutes' },
    { id: 'context-optimizer', name: 'Context Optimizer', category: 'optimization', enabled: true, runs: 234, lastRun: '1 min ago', description: 'Prune and optimize context to reduce token usage' },
    { id: 'error-memory', name: 'Error Memory', category: 'safety', enabled: true, runs: 15, lastRun: '3 hours ago', description: 'Remember past errors to avoid repeating them' },
    { id: 'image-processor', name: 'Image Processor', category: 'media', enabled: false, runs: 0, lastRun: 'never', description: 'Process and optimize images before sending' },
    { id: 'task-lock-manager', name: 'Task Lock Manager', category: 'safety', enabled: true, runs: 34, lastRun: '15 min ago', description: 'Prevent concurrent task modifications' },
    { id: 'emergency-bypass', name: 'Emergency Bypass', category: 'security', enabled: true, runs: 1, lastRun: '3 days ago', description: 'Emergency admin bypass for all restrictions' },
]

const categories = ['all', 'routing', 'security', 'safety', 'monitoring', 'system', 'scheduling', 'contacts', 'notification', 'optimization', 'media']

const hookLogs = [
    { time: '18:20:45', hook: 'router-guard', event: 'Routed +905357874261 → main-agent', status: 'success' },
    { time: '18:20:44', hook: 'billing-tracker', event: 'Logged 1,250 input + 890 output tokens', status: 'success' },
    { time: '18:20:43', hook: 'rate-limiter', event: 'Check passed: Ömer (3/10 in window)', status: 'success' },
    { time: '18:15:22', hook: 'router-guard', event: 'Routed +905070364656 → guest-agent', status: 'success' },
    { time: '18:10:11', hook: 'loop-detector', event: 'Loop check: iteration 1/3', status: 'warn' },
    { time: '18:05:00', hook: 'secret-guard', event: 'Redacted API key from response', status: 'warn' },
    { time: '18:00:11', hook: 'context-optimizer', event: 'Pruned 2,340 tokens from context', status: 'success' },
    { time: '17:55:00', hook: 'heartbeat-scheduler', event: 'Heartbeat check passed', status: 'success' },
]

export default function HookManager() {
    const [filter, setFilter] = useState('all')
    const [logFilter, setLogFilter] = useState('all')
    const [hookStates, setHookStates] = useState(
        Object.fromEntries(hooks.map(h => [h.id, h.enabled]))
    )

    const toggleHook = (id: string) => {
        setHookStates(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const filtered = filter === 'all' ? hooks : hooks.filter(h => h.category === filter)
    const filteredLogs = logFilter === 'all' ? hookLogs : hookLogs.filter(l => l.hook === logFilter)
    const enabledCount = Object.values(hookStates).filter(Boolean).length

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Hook Manager</h1>
                    <p className="text-sm text-gray-500 mt-1">{enabledCount}/{hooks.length} aktif</p>
                </div>
            </div>

            {/* Hook Execution Logs - MOVED TO TOP */}
            <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                <div className="p-4 border-b border-kamino-700 flex items-center justify-between">
                    <h2 className="font-semibold text-white">Son Hook Çalışmaları</h2>
                    <select
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value)}
                        className="px-3 py-1.5 bg-kamino-700 border border-kamino-600 rounded text-xs text-white focus:outline-none focus:border-kamino-accent"
                    >
                        <option value="all">Tüm Hooklar</option>
                        {hooks.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </div>
                <div className="divide-y divide-kamino-700 max-h-64 overflow-auto">
                    {filteredLogs.map((log, i) => (
                        <div key={i} className="p-3 flex items-center gap-3">
                            {log.status === 'success' ? (
                                <CheckCircle size={14} className="text-green-400 shrink-0" />
                            ) : (
                                <AlertCircle size={14} className="text-yellow-400 shrink-0" />
                            )}
                            <span className="text-xs text-gray-500 w-16 shrink-0">{log.time}</span>
                            <span className="text-xs text-blue-400 w-32 shrink-0 truncate">{log.hook}</span>
                            <span className="text-sm text-gray-300 flex-1 truncate">{log.event}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-colors ${filter === cat
                                ? 'bg-kamino-accent text-white'
                                : 'bg-kamino-800 text-gray-400 hover:text-white border border-kamino-700'
                            }`}
                    >
                        {cat === 'all' ? 'All' : cat}
                    </button>
                ))}
            </div>

            {/* Hook Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filtered.map((hook) => (
                    <div key={hook.id} className={`bg-kamino-800 rounded-lg border p-4 transition-colors ${hookStates[hook.id] ? 'border-kamino-700' : 'border-kamino-700 opacity-60'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Plug size={16} className={hookStates[hook.id] ? 'text-kamino-accent' : 'text-gray-600'} />
                                <span className="font-medium text-white">{hook.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-kamino-700 text-gray-400 rounded">
                                    {hook.category}
                                </span>
                            </div>
                            <button
                                onClick={() => toggleHook(hook.id)}
                                className={`relative w-10 h-5 rounded-full transition-colors ${hookStates[hook.id] ? 'bg-kamino-accent' : 'bg-kamino-600'
                                    }`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hookStates[hook.id] ? 'left-5' : 'left-0.5'
                                    }`} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{hook.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                            <span>{hook.runs} runs</span>
                            <span>Last: {hook.lastRun}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
