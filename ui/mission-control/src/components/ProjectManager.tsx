import './ProjectManager.css'
import { useState, useEffect, useCallback } from 'react'
import { FolderOpen, Globe, Play, Square, RotateCcw, Clock, Monitor, Smartphone, Tablet, ExternalLink, Settings2, Trash2, Eye } from 'lucide-react'

// Project proxy API runs on a different port, proxied through nginx
const PROJECT_API = import.meta.env.PROD
    ? `${window.location.origin}/api`
    : 'http://localhost:10099/api'

interface Project {
    slug: string
    type: 'static' | 'dynamic'
    status: 'active' | 'running' | 'stopped'
    port?: number
    container?: string
    created: string
    description?: string
    idleTimeout?: number
    visitors: number
    lastAccess?: string
}

interface ProjectStats {
    total: number
    last24h: number
    uniqueVisitors24h: number
    devices: Record<string, number>
    recentVisitors: Array<{
        timestamp: string
        ip: string
        userAgent: string
        path: string
    }>
}

interface ProjectSettings {
    defaultIdleTimeout: number
}

const IDLE_OPTIONS = [
    { label: '10 dakika', value: 600 },
    { label: '30 dakika', value: 1800 },
    { label: '1 saat', value: 3600 },
    { label: '2 saat', value: 7200 },
    { label: '6 saat', value: 21600 },
    { label: 'Sınırsız', value: 0 },
]

export default function ProjectManager() {
    const [projects, setProjects] = useState<Project[]>([])
    const [settings, setSettings] = useState<ProjectSettings>({ defaultIdleTimeout: 3600 })
    const [selectedProject, setSelectedProject] = useState<string | null>(null)
    const [stats, setStats] = useState<ProjectStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [showSettings, setShowSettings] = useState(false)

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch(`${PROJECT_API}/projects`)
            const data = await res.json()
            setProjects(data.projects || [])
            setSettings(data.settings || { defaultIdleTimeout: 3600 })
        } catch (err) {
            console.error('Failed to fetch projects:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchStats = useCallback(async (slug: string) => {
        try {
            const res = await fetch(`${PROJECT_API}/projects/${slug}/stats`)
            const data = await res.json()
            setStats(data)
        } catch (err) {
            console.error('Failed to fetch stats:', err)
        }
    }, [])

    useEffect(() => {
        fetchProjects()
        const interval = setInterval(fetchProjects, 15000)
        return () => clearInterval(interval)
    }, [fetchProjects])

    useEffect(() => {
        if (selectedProject) fetchStats(selectedProject)
    }, [selectedProject, fetchStats])

    const projectAction = async (slug: string, action: 'start' | 'stop' | 'restart') => {
        setActionLoading(`${slug}-${action}`)
        try {
            await fetch(`${PROJECT_API}/projects/${slug}/${action}`, { method: 'POST' })
            await fetchProjects()
        } catch (err) {
            console.error(`Failed to ${action} project:`, err)
        } finally {
            setActionLoading(null)
        }
    }

    const updateIdleTimeout = async (slug: string, timeout: number) => {
        try {
            await fetch(`${PROJECT_API}/projects/${slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idleTimeout: timeout }),
            })
            await fetchProjects()
        } catch (err) {
            console.error('Failed to update timeout:', err)
        }
    }

    const updateGlobalTimeout = async (timeout: number) => {
        try {
            await fetch(`${PROJECT_API}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ defaultIdleTimeout: timeout }),
            })
            setSettings(s => ({ ...s, defaultIdleTimeout: timeout }))
        } catch (err) {
            console.error('Failed to update global settings:', err)
        }
    }

    const getProjectUrl = (p: Project) => {
        const base = 'https://kamino.xn--merfaruk-m4a.com'
        return p.type === 'static' ? `${base}/p/${p.slug}/` : `${base}/p/d/${p.slug}/`
    }

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'az önce'
        if (mins < 60) return `${mins}dk önce`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}sa önce`
        const days = Math.floor(hours / 24)
        return `${days}g önce`
    }

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            running: 'status-badge-running',
            active: 'status-badge-active',
            stopped: 'status-badge-stopped',
        }
        return <span className={`status-badge ${colors[status] || ''}`}>{status}</span>
    }

    if (loading) {
        return <div className="projects-loading">Projeler yükleniyor...</div>
    }

    return (
        <div className="projects-container">
            {/* Header */}
            <div className="projects-header">
                <div>
                    <h2><Globe size={20} /> Proje Hosting</h2>
                    <p className="projects-subtitle">
                        {projects.length} proje • Statik + Docker container'larla dinamik hosting
                    </p>
                </div>
                <button className="btn-icon" onClick={() => setShowSettings(!showSettings)} title="Ayarlar">
                    <Settings2 size={18} />
                </button>
            </div>

            {/* Global Settings */}
            {showSettings && (
                <div className="projects-settings">
                    <h3><Clock size={16} /> Global Idle Timeout</h3>
                    <p className="settings-desc">Dinamik projeler bu süre sonunda otomatik durdurulur</p>
                    <div className="timeout-options">
                        {IDLE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                className={`timeout-btn ${settings.defaultIdleTimeout === opt.value ? 'active' : ''}`}
                                onClick={() => updateGlobalTimeout(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Project List */}
            {projects.length === 0 ? (
                <div className="projects-empty">
                    <FolderOpen size={48} strokeWidth={1} />
                    <p>Henüz proje yok</p>
                    <p className="projects-empty-hint">
                        Coder agent'a bir web projesi oluşturmasını söyle
                    </p>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map(p => (
                        <div
                            key={p.slug}
                            className={`project-card ${selectedProject === p.slug ? 'selected' : ''}`}
                            onClick={() => setSelectedProject(selectedProject === p.slug ? null : p.slug)}
                        >
                            <div className="project-card-header">
                                <div className="project-card-title">
                                    <span className="project-type-icon">
                                        {p.type === 'static' ? '📄' : '🐳'}
                                    </span>
                                    <h4>{p.slug}</h4>
                                    <StatusBadge status={p.status} />
                                </div>
                                <a
                                    href={getProjectUrl(p)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="project-link"
                                    onClick={e => e.stopPropagation()}
                                    title="Projeyi aç"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>

                            {p.description && (
                                <p className="project-desc">{p.description}</p>
                            )}

                            <div className="project-meta">
                                <span><Eye size={12} /> {p.visitors || 0} ziyaret</span>
                                <span><Clock size={12} /> {timeAgo(p.lastAccess || p.created)}</span>
                                <span className="project-type-label">{p.type}</span>
                            </div>

                            {/* Dynamic project controls */}
                            {p.type === 'dynamic' && (
                                <div className="project-controls" onClick={e => e.stopPropagation()}>
                                    {p.status === 'stopped' ? (
                                        <button
                                            className="ctrl-btn ctrl-start"
                                            onClick={() => projectAction(p.slug, 'start')}
                                            disabled={actionLoading === `${p.slug}-start`}
                                        >
                                            <Play size={12} /> Başlat
                                        </button>
                                    ) : (
                                        <button
                                            className="ctrl-btn ctrl-stop"
                                            onClick={() => projectAction(p.slug, 'stop')}
                                            disabled={actionLoading === `${p.slug}-stop`}
                                        >
                                            <Square size={12} /> Durdur
                                        </button>
                                    )}
                                    <button
                                        className="ctrl-btn ctrl-restart"
                                        onClick={() => projectAction(p.slug, 'restart')}
                                        disabled={actionLoading === `${p.slug}-restart`}
                                    >
                                        <RotateCcw size={12} /> Yeniden Başlat
                                    </button>

                                    <select
                                        className="idle-select"
                                        value={p.idleTimeout ?? settings.defaultIdleTimeout}
                                        onChange={e => updateIdleTimeout(p.slug, Number(e.target.value))}
                                    >
                                        {IDLE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                ⏱ {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Stats panel (expanded) */}
                            {selectedProject === p.slug && stats && (
                                <div className="project-stats">
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <span className="stat-value">{stats.total}</span>
                                            <span className="stat-label">Toplam Ziyaret</span>
                                        </div>
                                        <div className="stat-card">
                                            <span className="stat-value">{stats.last24h}</span>
                                            <span className="stat-label">Son 24 Saat</span>
                                        </div>
                                        <div className="stat-card">
                                            <span className="stat-value">{stats.uniqueVisitors24h}</span>
                                            <span className="stat-label">Tekil Ziyaretçi</span>
                                        </div>
                                    </div>

                                    {/* Device breakdown */}
                                    {Object.keys(stats.devices).length > 0 && (
                                        <div className="device-breakdown">
                                            <h5>Cihaz Dağılımı (24s)</h5>
                                            <div className="device-bars">
                                                {Object.entries(stats.devices).map(([device, count]) => {
                                                    const total = Object.values(stats.devices).reduce((a, b) => a + b, 0)
                                                    const pct = Math.round((count / total) * 100)
                                                    const icon = device === 'Mobile' ? <Smartphone size={12} /> :
                                                        device === 'Tablet' ? <Tablet size={12} /> :
                                                            <Monitor size={12} />
                                                    return (
                                                        <div key={device} className="device-bar">
                                                            <span className="device-label">{icon} {device}</span>
                                                            <div className="device-bar-track">
                                                                <div className="device-bar-fill" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span className="device-count">{count} ({pct}%)</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent visitors */}
                                    {stats.recentVisitors.length > 0 && (
                                        <div className="recent-visitors">
                                            <h5>Son Ziyaretçiler</h5>
                                            <div className="visitor-list">
                                                {stats.recentVisitors.slice(0, 10).map((v, i) => (
                                                    <div key={i} className="visitor-row">
                                                        <span className="visitor-time">{timeAgo(v.timestamp)}</span>
                                                        <span className="visitor-ip">{v.ip}</span>
                                                        <span className="visitor-path">{v.path}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
