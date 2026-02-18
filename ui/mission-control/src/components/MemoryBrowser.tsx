import { FileText, FolderOpen, ChevronRight, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API_BASE_URL, API_KEY } from '../config/api'

interface MemoryFile {
    id: string
    name: string
    path: string
    size: number
    modified: string
    type: string
    source: string
}

interface MemoryBrowserProps {
    initialPath?: string
}

export default function MemoryBrowser({ initialPath }: MemoryBrowserProps) {
    const [files, setFiles] = useState<MemoryFile[]>([])
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [sourceFilter, setSourceFilter] = useState('all')

    useEffect(() => {
        fetchFiles()
    }, [])

    useEffect(() => {
        if (initialPath && files.length > 0) {
            fetchContent(initialPath)
        }
    }, [initialPath, files])

    const fetchFiles = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/memory?key=${API_KEY}`)
            if (res.ok) {
                const data = await res.json()
                setFiles(data.files || [])
            }
        } catch (e) {
            console.error('Failed to fetch memory files:', e)
        } finally {
            setLoading(false)
        }
    }

    const fetchContent = async (filePath: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/memory/content?key=${API_KEY}&path=${encodeURIComponent(filePath)}`)
            if (res.ok) {
                const data = await res.json()
                setContent(data.content)
                setSelectedFile(filePath)
            }
        } catch (e) {
            console.error('Failed to fetch content:', e)
        }
    }

    // Group files by source
    const sources = [...new Set(files.map(f => f.source))].sort()
    const filteredFiles = sourceFilter === 'all' ? files : files.filter(f => f.source === sourceFilter)

    if (loading) {
        return <div className="p-6 text-gray-400">Loading memory files...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white">Memory & Workspace Browser</h1>

            {/* Source filter */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setSourceFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${sourceFilter === 'all'
                        ? 'bg-kamino-accent text-white'
                        : 'bg-kamino-700 text-gray-400 hover:bg-kamino-600'
                        }`}
                >
                    All ({files.length})
                </button>
                {sources.map(source => {
                    const count = files.filter(f => f.source === source).length
                    return (
                        <button
                            key={source}
                            onClick={() => setSourceFilter(source)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${sourceFilter === source
                                ? 'bg-kamino-accent text-white'
                                : 'bg-kamino-700 text-gray-400 hover:bg-kamino-600'
                                }`}
                        >
                            {source} ({count})
                        </button>
                    )
                })}
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Files List */}
                <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                    <div className="p-4 border-b border-kamino-700">
                        <h2 className="font-semibold text-white">Files ({filteredFiles.length})</h2>
                    </div>
                    <div className="divide-y divide-kamino-700 max-h-[600px] overflow-y-auto">
                        {filteredFiles.length === 0 ? (
                            <div className="p-4 text-gray-500 text-sm text-center">No files found</div>
                        ) : filteredFiles.map((file) => (
                            <div
                                key={file.id}
                                onClick={() => fetchContent(file.path)}
                                className={`p-3 cursor-pointer hover:bg-kamino-700/50 transition-colors ${selectedFile === file.path ? 'bg-kamino-700' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText size={14} className="text-kamino-accent flex-shrink-0" />
                                    <span className="text-sm font-medium text-white truncate">{file.name}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 pl-6">
                                    <span className="truncate">{file.source}</span>
                                    <span className="flex-shrink-0 ml-2">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Viewer */}
                <div className="col-span-2 bg-kamino-800 rounded-lg border border-kamino-700">
                    <div className="p-4 border-b border-kamino-700 flex items-center justify-between">
                        <h2 className="font-semibold text-white truncate">
                            {selectedFile ? selectedFile.split('/').slice(-2).join('/') : 'Select a file'}
                        </h2>
                        {selectedFile && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                {selectedFile}
                            </span>
                        )}
                    </div>
                    <div className="p-4">
                        {selectedFile ? (
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-[540px] overflow-y-auto leading-relaxed">
                                {content}
                            </pre>
                        ) : (
                            <div className="text-center text-gray-500 py-16">
                                <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
                                <p>Select a file to view its content</p>
                                <p className="text-xs mt-2">Browsing workspace, agents, hooks, and config files</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
