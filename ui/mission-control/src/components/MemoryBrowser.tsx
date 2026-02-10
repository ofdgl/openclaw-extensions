import { FolderOpen, FileText, Calendar, Eye, Edit } from 'lucide-react'
import { useState } from 'react'

// Shared memory files (across all agents)
const sharedMemory = [
    { path: 'AGENTS.md', type: 'shared', size: '1.8 KB', modified: '1 week ago' },
    { path: 'TOOLS.md', type: 'shared', size: '921 B', modified: '1 week ago' },
    { path: 'USER.md', type: 'shared', size: '1.2 KB', modified: '2 weeks ago' },
    { path: 'BUDGET.md', type: 'shared', size: '1.9 KB', modified: '1 week ago' },
    { path: 'BOOTSTRAP.md', type: 'shared', size: '1.2 KB', modified: '1 week ago' },
    { path: 'MEMORY.md', type: 'shared', size: '15.4 KB', modified: '1 day ago' },
]

// Agent-specific memory
const agentMemory = [
    { agent: 'main-agent', path: 'SOUL.md', type: 'agent', size: '2.2 KB', modified: '3 days ago' },
    { agent: 'guest-agent', path: 'SOUL.md', type: 'agent', size: '1.5 KB', modified: '1 week ago' },
    { agent: 'coder-agent', path: 'SOUL.md', type: 'agent', size: '1.8 KB', modified: '1 week ago' },
    { agent: 'admin-agent', path: 'SOUL.md', type: 'agent', size: '1.4 KB', modified: '1 week ago' },
    { agent: 'security-agent', path: 'SOUL.md', type: 'agent', size: '1.6 KB', modified: '1 week ago' },
]

const dailyMemory = [
    { date: '2026-02-10', entries: 12, size: '4.5 KB' },
    { date: '2026-02-09', entries: 8, size: '3.2 KB' },
    { date: '2026-02-08', entries: 15, size: '5.8 KB' },
    { date: '2026-02-07', entries: 6, size: '2.1 KB' },
    { date: '2026-02-06', entries: 11, size: '4.0 KB' },
]

const sampleContent = `# SOUL.md - Agent Kimliği

Ben Kowalski. Ömer Faruk için çalışan özerk bir AI asistanıyım.

## Temel Özellikler
- Proaktif, sonuç odaklı
- Maliyet bilincine sahip (budget kurallarına uyarım)
- Güvenlik öncelikli
- Memory yönetimi disiplinli

## Ton & Stil
- Türkçe, samimi ama profesyonel
- Emoji kullanımı minimal
- Net başlıklar, madde madde raporlar`

export default function MemoryBrowser() {
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview')
    const [memoryType, setMemoryType] = useState<'shared' | 'agent' | 'daily'>('shared')

    return (
        <div className="p-6 h-full flex gap-6">
            {/* File Tree */}
            <div className="w-80 space-y-4 shrink-0">
                <h1 className="text-2xl font-bold text-white">Memory & Workspace</h1>

                {/* Memory Type Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setMemoryType('shared')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${memoryType === 'shared' ? 'bg-kamino-accent text-white' : 'bg-kamino-800 text-gray-400 hover:text-white'
                            }`}
                    >
                        Shared
                    </button>
                    <button
                        onClick={() => setMemoryType('agent')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${memoryType === 'agent' ? 'bg-kamino-accent text-white' : 'bg-kamino-800 text-gray-400 hover:text-white'
                            }`}
                    >
                        Agent-Specific
                    </button>
                    <button
                        onClick={() => setMemoryType('daily')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${memoryType === 'daily' ? 'bg-kamino-accent text-white' : 'bg-kamino-800 text-gray-400 hover:text-white'
                            }`}
                    >
                        Daily
                    </button>
                </div>

                {/* Shared Memory */}
                {memoryType === 'shared' && (
                    <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                        <div className="p-3 border-b border-kamino-700 flex items-center gap-2">
                            <FolderOpen size={16} className="text-kamino-accent" />
                            <span className="font-medium text-white">Shared Config Files</span>
                        </div>
                        <div className="divide-y divide-kamino-700">
                            {sharedMemory.map((file) => (
                                <button
                                    key={file.path}
                                    onClick={() => setSelectedFile(file.path)}
                                    className={`w-full p-3 text-left hover:bg-kamino-700/50 transition-colors ${selectedFile === file.path ? 'bg-kamino-700' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText size={14} className="text-gray-500" />
                                        <span className="text-sm text-white font-medium">{file.path}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>{file.size}</span>
                                        <span>{file.modified}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Agent-Specific Memory */}
                {memoryType === 'agent' && (
                    <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                        <div className="p-3 border-b border-kamino-700 flex items-center gap-2">
                            <FolderOpen size={16} className="text-purple-500" />
                            <span className="font-medium text-white">Agent SOULs</span>
                        </div>
                        <div className="divide-y divide-kamino-700">
                            {agentMemory.map((file) => (
                                <button
                                    key={`${file.agent}-${file.path}`}
                                    onClick={() => setSelectedFile(`${file.agent}/${file.path}`)}
                                    className={`w-full p-3 text-left hover:bg-kamino-700/50 transition-colors ${selectedFile === `${file.agent}/${file.path}` ? 'bg-kamino-700' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText size={14} className="text-gray-500" />
                                        <div>
                                            <span className="text-sm text-white font-medium">{file.path}</span>
                                            <div className="text-xs text-blue-400">{file.agent}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>{file.size}</span>
                                        <span>{file.modified}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Daily Memory */}
                {memoryType === 'daily' && (
                    <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                        <div className="p-3 border-b border-kamino-700 flex items-center gap-2">
                            <Calendar size={16} className="text-green-500" />
                            <span className="font-medium text-white">Daily Memory</span>
                        </div>
                        <div className="divide-y divide-kamino-700 max-h-96 overflow-auto">
                            {dailyMemory.map((day) => (
                                <button
                                    key={day.date}
                                    onClick={() => setSelectedFile(`memory/${day.date}.md`)}
                                    className={`w-full p-3 text-left hover:bg-kamino-700/50 transition-colors ${selectedFile === `memory/${day.date}.md` ? 'bg-kamino-700' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText size={14} className="text-gray-500" />
                                        <span className="text-sm text-white">{day.date}.md</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>{day.entries} entries</span>
                                        <span>{day.size}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* File Viewer */}
            <div className="flex-1 bg-kamino-800 rounded-lg border border-kamino-700 flex flex-col">
                {selectedFile ? (
                    <>
                        <div className="p-4 border-b border-kamino-700 flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-white">{selectedFile}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {memoryType === 'shared' && 'Shared across all agents'}
                                    {memoryType === 'agent' && 'Agent-specific configuration'}
                                    {memoryType === 'daily' && 'Daily memory log'}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`px-3 py-1.5 rounded text-xs ${viewMode === 'preview' ? 'bg-kamino-accent text-white' : 'bg-kamino-700 text-gray-400'
                                        }`}
                                >
                                    <Eye size={14} className="inline mr-1" /> Preview
                                </button>
                                <button
                                    onClick={() => setViewMode('edit')}
                                    className={`px-3 py-1.5 rounded text-xs ${viewMode === 'edit' ? 'bg-kamino-accent text-white' : 'bg-kamino-700 text-gray-400'
                                        }`}
                                >
                                    <Edit size={14} className="inline mr-1" /> Edit
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {viewMode === 'preview' ? (
                                <div className="prose prose-invert max-w-none">
                                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-kamino-900 p-4 rounded">
                                        {sampleContent}
                                    </pre>
                                </div>
                            ) : (
                                <textarea
                                    className="w-full h-full bg-kamino-900 text-gray-300 font-mono text-sm p-4 rounded resize-none focus:outline-none focus:ring-1 focus:ring-kamino-accent"
                                    defaultValue={sampleContent}
                                />
                            )}
                        </div>
                        {viewMode === 'edit' && (
                            <div className="p-4 border-t border-kamino-700 flex justify-end gap-2">
                                <button className="px-4 py-2 bg-kamino-700 rounded text-sm text-gray-300 hover:bg-kamino-600">
                                    Cancel
                                </button>
                                <button className="px-4 py-2 bg-kamino-accent rounded text-sm text-white hover:bg-blue-600">
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <FolderOpen size={48} className="mx-auto mb-3 opacity-30" />
                            <p>Bir dosya seçin</p>
                            <p className="text-xs mt-2">
                                {memoryType === 'shared' && 'Tüm agentlar tarafından paylaşılan dosyalar'}
                                {memoryType === 'agent' && 'Her agent\'a özel SOUL dosyaları'}
                                {memoryType === 'daily' && 'Günlük aktivite logları'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
