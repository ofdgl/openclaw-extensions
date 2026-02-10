import { FileText, FolderOpen, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API_BASE_URL, API_KEY } from '../config/api'

interface MemoryFile {
    path: string
    type: string
    size: number
    modified: string
}

export default function MemoryBrowser() {
    const [files, setFiles] = useState<MemoryFile[]>([])
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState('all')

    useEffect(() => {
        fetchFiles()
    }, [typeFilter])

    const fetchFiles = async () => {
        try {
            const url = typeFilter === 'all'
                ? `${API_BASE_URL}/api/memory/files?key=${API_KEY}`
                : `${API_BASE_URL}/api/memory/files?key=${API_KEY}&type=${typeFilter}`

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setFiles(data.files)
            }
        } catch (e) {
            console.error('Failed to fetch memory files:', e)
        } finally {
            setLoading(false)
        }
    }

    const fetchContent = async (path: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/memory/content?key=${API_KEY}&path=${encodeURIComponent(path)}`)
            if (res.ok) {
                const data = await res.json()
                setContent(data.content)
                setSelectedFile(path)
            }
        } catch (e) {
            console.error('Failed to fetch content:', e)
        }
    }

    if (loading) {
        return <div className="p-6 text-gray-400">Loading memory files...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white">Memory & Workspace Browser</h1>

            <div className="flex gap-2">
                {['all', 'daily', 'shared', 'agent'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={`px-4 py-2 rounded-lg transition-colors ${typeFilter === type
                            ? 'bg-kamino-accent text-white'
                            : 'bg-kamino-700 text-gray-400 hover:bg-kamino-600'
                            }`}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Files List */}
                <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                    <div className="p-4 border-b border-kamino-700">
                        <h2 className="font-semibold text-white">Memory Files ({files.length})</h2>
                    </div>
                    <div className="divide-y divide-kamino-700 max-h-[600px] overflow-y-auto">
                        {files.map((file) => (
                            <div
                                key={file.path}
                                onClick={() => fetchContent(file.path)}
                                className={`p-4 cursor-pointer hover:bg-kamino-700/50 transition-colors ${selectedFile === file.path ? 'bg-kamino-700' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText size={16} className="text-kamino-accent" />
                                    <span className="text-sm font-medium text-white">{file.path.split('/').pop()}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                                    <span>{new Date(file.modified).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Viewer */}
                <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                    <div className="p-4 border-b border-kamino-700">
                        <h2 className="font-semibold text-white">
                            {selectedFile ? selectedFile : 'Select a file'}
                        </h2>
                    </div>
                    <div className="p-4">
                        {selectedFile ? (
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-[540px] overflow-y-auto">
                                {content}
                            </pre>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Select a file to view its content
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
