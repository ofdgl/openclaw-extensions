import { Clock, Play, Pause, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API_BASE_URL, API_KEY } from '../config/api'

interface CronJob {
    id: string
    name: string
    schedule: string
    enabled: boolean
    lastRun: string | null
    nextRun: string | null
    agent: string
    model?: string
    message?: string
    description?: string
}

interface JobForm {
    name: string
    schedule: string
    agent: string
    model: string
    message: string
    description: string
}

const emptyForm: JobForm = { name: '', schedule: '0 9 * * *', agent: 'main', model: '', message: '', description: '' }

export default function CronTasks() {
    const [jobs, setJobs] = useState<CronJob[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<JobForm>(emptyForm)

    useEffect(() => {
        fetchJobs()
        const interval = setInterval(fetchJobs, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchJobs = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/cron/jobs?key=${API_KEY}`)
            if (res.ok) {
                const data = await res.json()
                setJobs(data.jobs)
            }
        } catch (e) {
            console.error('Failed to fetch cron jobs:', e)
        } finally {
            setLoading(false)
        }
    }

    const triggerJob = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/cron/jobs/${id}/trigger?key=${API_KEY}`, { method: 'POST' })
            if (res.ok) {
                fetchJobs()
                alert('Job triggered successfully!')
            }
        } catch (e) {
            console.error('Failed to trigger job:', e)
        }
    }

    const toggleJob = async (id: string, enabled: boolean) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/cron/jobs/${id}?key=${API_KEY}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !enabled })
            })
            if (res.ok) fetchJobs()
        } catch (e) {
            console.error('Failed to toggle job:', e)
        }
    }

    const createJob = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/cron/jobs?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            if (res.ok) {
                fetchJobs()
                setShowAddForm(false)
                setForm(emptyForm)
            } else {
                const err = await res.json()
                alert(err.error || 'Failed to create job')
            }
        } catch (e) {
            console.error('Failed to create job:', e)
        }
    }

    const updateJob = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/cron/jobs/${id}?key=${API_KEY}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            if (res.ok) {
                fetchJobs()
                setEditingId(null)
                setForm(emptyForm)
            }
        } catch (e) {
            console.error('Failed to update job:', e)
        }
    }

    const deleteJob = async (id: string) => {
        if (!confirm('Delete this cron job?')) return
        try {
            const res = await fetch(`${API_BASE_URL}/api/cron/jobs/${id}?key=${API_KEY}`, { method: 'DELETE' })
            if (res.ok) fetchJobs()
        } catch (e) {
            console.error('Failed to delete job:', e)
        }
    }

    const startEdit = (job: CronJob) => {
        setEditingId(job.id)
        setForm({
            name: job.name,
            schedule: job.schedule,
            agent: job.agent,
            model: job.model || '',
            message: job.message || '',
            description: job.description || ''
        })
        setShowAddForm(false)
    }

    if (loading) {
        return <div className="p-6 text-gray-400">Loading cron jobs...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Cron & Scheduled Tasks</h1>
                <button
                    onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setForm(emptyForm) }}
                    className="flex items-center gap-2 px-4 py-2 bg-kamino-accent hover:bg-blue-600 rounded-lg text-white text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Job
                </button>
            </div>

            {/* Add/Edit Form */}
            {(showAddForm || editingId) && (
                <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-accent/50 space-y-3">
                    <h3 className="text-white font-semibold">
                        {editingId ? 'Edit Job' : 'New Cron Job'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="morning-greeting"
                                className="w-full bg-kamino-900 border border-kamino-700 rounded-lg px-3 py-2 text-white text-sm focus:border-kamino-accent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Schedule (cron)</label>
                            <input
                                type="text"
                                value={form.schedule}
                                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                                placeholder="0 9 * * *"
                                className="w-full bg-kamino-900 border border-kamino-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-kamino-accent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Agent</label>
                            <select
                                value={form.agent}
                                onChange={(e) => setForm({ ...form, agent: e.target.value })}
                                className="w-full bg-kamino-900 border border-kamino-700 rounded-lg px-3 py-2 text-white text-sm focus:border-kamino-accent outline-none"
                            >
                                <option value="main">Main</option>
                                <option value="admin">Admin</option>
                                <option value="security">Security</option>
                                <option value="demo">Demo</option>
                                <option value="intern">Intern</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Model (optional)</label>
                            <select
                                value={form.model}
                                onChange={(e) => setForm({ ...form, model: e.target.value })}
                                className="w-full bg-kamino-900 border border-kamino-700 rounded-lg px-3 py-2 text-white text-sm focus:border-kamino-accent outline-none"
                            >
                                <option value="">Default Model</option>
                                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                                <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                                <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                                <option value="openai/gpt-4o">GPT-4o</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="What this job does..."
                                className="w-full bg-kamino-900 border border-kamino-700 rounded-lg px-3 py-2 text-white text-sm focus:border-kamino-accent outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Message / Prompt</label>
                        <textarea
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            placeholder="The message/prompt to send to the agent..."
                            rows={2}
                            className="w-full bg-kamino-900 border border-kamino-700 rounded-lg px-3 py-2 text-white text-sm focus:border-kamino-accent outline-none resize-none"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => { setShowAddForm(false); setEditingId(null); setForm(emptyForm) }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-white text-sm"
                        >
                            <X size={14} /> Cancel
                        </button>
                        <button
                            onClick={() => editingId ? updateJob(editingId) : createJob()}
                            disabled={!form.name || !form.schedule}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm"
                        >
                            <Save size={14} /> {editingId ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            )}

            {/* Job List */}
            {jobs.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                    No cron jobs configured. Click "Add Job" to create one.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {jobs.map((job) => (
                        <div
                            key={job.id}
                            className="bg-kamino-800 rounded-lg p-4 border border-kamino-700"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-kamino-accent" />
                                    <h3 className="font-semibold text-white">{job.name}</h3>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => startEdit(job)}
                                        className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={14} className="text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => toggleJob(job.id, job.enabled)}
                                        className={`p-1.5 rounded-lg transition-colors ${job.enabled
                                            ? 'bg-green-500/20 hover:bg-green-500/30'
                                            : 'bg-gray-500/20 hover:bg-gray-500/30'
                                            }`}
                                        title={job.enabled ? 'Disable' : 'Enable'}
                                    >
                                        {job.enabled ? (
                                            <Pause size={14} className="text-green-400" />
                                        ) : (
                                            <Play size={14} className="text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => triggerJob(job.id)}
                                        disabled={!job.enabled}
                                        className="px-2 py-1 bg-kamino-accent hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-xs"
                                    >
                                        Run Now
                                    </button>
                                    <button
                                        onClick={() => deleteJob(job.id)}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1 text-sm text-gray-400">
                                <div>Schedule: <span className="text-white font-mono">{job.schedule}</span></div>
                                <div>Agent: <span className="text-white">{job.agent}</span></div>
                                {job.description && (
                                    <div className="text-gray-500 italic">{job.description}</div>
                                )}
                                {job.model && (
                                    <div>Model: <span className="text-cyan-400 font-mono text-xs">{job.model}</span></div>
                                )}
                                {job.message && (
                                    <div className="mt-1">
                                        <span className="text-gray-500">Prompt: </span>
                                        <span className="text-gray-300 text-xs">{job.message.length > 80 ? job.message.slice(0, 80) + '...' : job.message}</span>
                                    </div>
                                )}
                                {job.lastRun && (
                                    <div>Last Run: <span className="text-white">
                                        {new Date(job.lastRun).toLocaleString()}
                                    </span></div>
                                )}
                                {job.nextRun && (
                                    <div>Next Run: <span className="text-green-400">
                                        {new Date(job.nextRun).toLocaleString()}
                                    </span></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
