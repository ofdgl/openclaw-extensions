import { Clock, Play, Pause } from 'lucide-react'
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
}

export default function CronTasks() {
    const [jobs, setJobs] = useState<CronJob[]>([])
    const [loading, setLoading] = useState(true)

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
            const res = await fetch(`${API_BASE_URL}/api/cron/${id}/trigger?key=${API_KEY}`, { method: 'POST' })
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
            const res = await fetch(`${API_BASE_URL}/api/cron/${id}?key=${API_KEY}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !enabled })
            })
            if (res.ok) fetchJobs()
        } catch (e) {
            console.error('Failed to toggle job:', e)
        }
    }

    if (loading) {
        return <div className="p-6 text-gray-400">Loading cron jobs...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white">Cron & Scheduled Tasks</h1>

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
                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleJob(job.id, job.enabled)}
                                    className={`p-2 rounded-lg transition-colors ${job.enabled
                                        ? 'bg-green-500/20 hover:bg-green-500/30'
                                        : 'bg-gray-500/20 hover:bg-gray-500/30'
                                        }`}
                                >
                                    {job.enabled ? (
                                        <Pause size={16} className="text-green-400" />
                                    ) : (
                                        <Play size={16} className="text-gray-400" />
                                    )}
                                </button>
                                <button
                                    onClick={() => triggerJob(job.id)}
                                    disabled={!job.enabled}
                                    className="px-3 py-1 bg-kamino-accent hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm"
                                >
                                    Run Now
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                            <div>Schedule: <span className="text-white font-mono">{job.schedule}</span></div>
                            <div>Agent: <span className="text-white">{job.agent}</span></div>
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
        </div>
    )
}
