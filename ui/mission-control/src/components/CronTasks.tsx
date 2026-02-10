import { Clock, Play, Plus, Edit } from 'lucide-react'
import { useState } from 'react'

const cronJobs = [
    {
        id: 'backup-daily',
        name: 'Daily Backup',
        schedule: '0 2 * * *',
        description: 'Backup credentials, contacts, and workspace',
        agent: 'admin-agent',
        model: 'claude-haiku',
        enabled: true,
        lastRun: '02:00 (today)',
        nextRun: '02:00 (tomorrow)',
        status: 'success',
    },
    {
        id: 'heartbeat',
        name: 'Heartbeat Check',
        schedule: '*/30 * * * *',
        description: 'Send heartbeat status every 30 minutes',
        agent: 'main-agent',
        model: 'gemini-2.0-flash',
        enabled: true,
        lastRun: '17:30',
        nextRun: '18:00',
        status: 'success',
    },
    {
        id: 'daily-standup',
        name: 'Daily Standup',
        schedule: '0 9 * * 1-5',
        description: 'Send daily summary to admin (weekdays)',
        agent: 'main-agent',
        model: 'claude-sonnet-4-5',
        enabled: false,
        lastRun: '09:00 (yesterday)',
        nextRun: 'Disabled',
        status: 'disabled',
    },
    {
        id: 'cleanup-logs',
        name: 'Log Cleanup',
        schedule: '0 3 * * 0',
        description: 'Remove logs older than 30 days',
        agent: 'admin-agent',
        model: 'gemini-2.0-flash',
        enabled: true,
        lastRun: '3 days ago',
        nextRun: 'Sunday 03:00',
        status: 'success',
    },
    {
        id: 'model-usage-report',
        name: 'Weekly Model Report',
        schedule: '0 10 * * 1',
        description: 'Send weekly model usage and cost report',
        agent: 'main-agent',
        model: 'claude-sonnet-4-5',
        enabled: true,
        lastRun: '1 week ago',
        nextRun: 'Monday 10:00',
        status: 'success',
    },
    {
        id: 'security-scan',
        name: 'Security Scan',
        schedule: '0 4 * * *',
        description: 'Run security checks and vulnerability scans',
        agent: 'security-agent',
        model: 'gemini-2.0-flash',
        enabled: false,
        lastRun: 'Never',
        nextRun: 'Disabled',
        status: 'disabled',
    },
]

const scheduledTasks = [
    { time: '02:00', task: 'Daily Backup', agent: 'admin-agent', due: 'in 7h 30m' },
    { time: '18:00', task: 'Heartbeat Check', agent: 'main-agent', due: 'in 27m' },
    { time: '03:00 Sun', task: 'Log Cleanup', agent: 'admin-agent', due: 'in 4 days' },
    { time: '10:00 Mon', task: 'Weekly Model Report', agent: 'main-agent', due: 'in 6 days' },
]

export default function CronTasks() {
    const [showAddModal, setShowAddModal] = useState(false)

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Cron Jobs & Scheduled Tasks</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-kamino-accent rounded-lg text-white hover:bg-blue-600"
                >
                    <Plus size={16} />
                    Add Cron Job
                </button>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                <div className="p-4 border-b border-kamino-700">
                    <h2 className="font-semibold text-white">Upcoming</h2>
                </div>
                <div className="divide-y divide-kamino-700">
                    {scheduledTasks.map((task, i) => (
                        <div key={i} className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-kamino-accent" />
                                <div>
                                    <div className="text-sm text-white">{task.task}</div>
                                    <div className="text-xs text-gray-500">{task.agent}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-500">{task.time}</span>
                                <span className="text-xs text-gray-400">{task.due}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cron Jobs List */}
            <div className="space-y-3">
                {cronJobs.map((job) => (
                    <div key={job.id} className="bg-kamino-800 rounded-lg border border-kamino-700 p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-semibold text-white">{job.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded ${job.status === 'success'
                                            ? 'bg-green-500/20 text-green-400'
                                            : job.status === 'disabled'
                                                ? 'bg-gray-500/20 text-gray-400'
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {job.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 mb-2">{job.description}</p>
                                <div className="flex gap-4 text-xs mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Agent:</span>
                                        <span className="text-blue-400">{job.agent}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Model:</span>
                                        <span className="text-purple-400">{job.model}</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-xs text-gray-500">
                                    <span className="font-mono bg-kamino-700 px-2 py-0.5 rounded">{job.schedule}</span>
                                    <span>Last: {job.lastRun}</span>
                                    <span>Next: {job.nextRun}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-kamino-700 rounded transition-colors"
                                    title="Edit"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-kamino-700 rounded transition-colors"
                                    title="Run now"
                                >
                                    <Play size={16} />
                                </button>
                                <button
                                    className={`relative w-10 h-5 rounded-full transition-colors ${job.enabled ? 'bg-kamino-accent' : 'bg-kamino-600'
                                        }`}
                                    title={job.enabled ? 'Disable' : 'Enable'}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${job.enabled ? 'left-5' : 'left-0.5'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Toplam Job</div>
                    <div className="text-2xl font-bold text-white">{cronJobs.length}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Aktif</div>
                    <div className="text-2xl font-bold text-green-400">{cronJobs.filter(j => j.enabled).length}</div>
                </div>
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                    <div className="text-sm text-gray-400">Devre Dışı</div>
                    <div className="text-2xl font-bold text-gray-400">{cronJobs.filter(j => !j.enabled).length}</div>
                </div>
            </div>
        </div>
    )
}
