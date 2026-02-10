import { Download, AlertCircle, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API_BASE_URL, API_KEY } from '../config/api'

const logLevels = ['all', 'info', 'warn', 'error']

interface LogEntry {
    time: string
    source: string
    level: string
    message: string
}

export default function LogViewer() {
    const [logFiles, setLogFiles] = useState<string[]>([])
    const [selectedFile, setSelectedFile] = useState('gateway.log')
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [levelFilter, setLevelFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLogFiles()
    }, [])

    useEffect(() => {
        if (selectedFile) {
            fetchLogs()
        }
    }, [selectedFile])

    const fetchLogFiles = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/logviewer/files?key=${API_KEY}`)
            if (res.ok) {
                const data = await res.json()
                setLogFiles(data.files || ['gateway.log'])
            }
        } catch (e) {
            console.error('Failed to fetch log files:', e)
        }
    }

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/api/logviewer/tail?key=${API_KEY}&file=${selectedFile}&lines=100`)
            if (res.ok) {
                const data = await res.json()
                setLogs(data.entries || [])
            }
        } catch (e) {
            console.error('Failed to fetch logs:', e)
            setLogs([])
        } finally {
            setLoading(false)
        }
    }

    const filtered = logs.filter(log => {
        const matchesLevel = levelFilter === 'all' || log.level === levelFilter
        const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesLevel && matchesSearch
    })

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Log Viewer</h1>
                <div className="flex gap-2">
                    <button
                        onClick={fetchLogs}
                        className="flex items-center gap-2 px-3 py-2 bg-kamino-700 rounded-lg text-sm text-gray-300 hover:bg-kamino-600"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-kamino-700 rounded-lg text-sm text-gray-300 hover:bg-kamino-600">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kamino-accent"
                    />
                </div>
                <select
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="px-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white focus:outline-none focus:border-kamino-accent"
                >
                    {logFiles.map(file => (
                        <option key={file} value={file}>{file}</option>
                    ))}
                </select>
                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="px-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white focus:outline-none focus:border-kamino-accent"
                >
                    {logLevels.map(level => (
                        <option key={level} value={level}>{level.toUpperCase()}</option>
                    ))}
                </select>
            </div>

            {/* Logs */}
            <div className=" flex-1 bg-kamino-800 rounded-lg border border-kamino-700 overflow-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading logs...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No logs found</div>
                ) : (
                    <div className="divide-y divide-kamino-700">
                        {filtered.map((log, idx) => (
                            <div key={idx} className="p-3 hover:bg-kamino-700/50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <span className="text-xs text-gray-500 font-mono w-20 flex-shrink-0">
                                        {log.time}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                                ${log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                                                    log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-green-500/20 text-green-400'}`}
                                            >
                                                {log.level.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">{log.source}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 break-words">{log.message}</p>
                                    </div>
                                    {log.level === 'error' && (
                                        <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
