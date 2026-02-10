import { MessageSquare, Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Page } from '../App'
import { API_BASE_URL, API_KEY } from '../config/api'

interface SessionManagerProps {
    onNavigate?: (page: Page) => void
}

interface Session {
    id: string
    user: string
    agent: string
    status: string
    model: string
    messageCount: number
    inputTokens: number
    outputTokens: number
    cost: number
    lastActivity: string
}

interface Message {
    role: string
    content: string
    timestamp: string
    tokens?: number
    cost?: number
}

export default function SessionManager({ onNavigate }: SessionManagerProps) {
    const [sessions, setSessions] = useState<Session[]>([])
    const [selectedSession, setSelectedSession] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/sessions?key=${API_KEY}`)

                if (res.ok) {
                    const data = await res.json()
                    setSessions(data.sessions)
                    setError(false)
                } else {
                    setError(true)
                }
            } catch (e) {
                console.error('Failed to fetch sessions:', e)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchSessions()
        const interval = setInterval(fetchSessions, 10000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!selectedSession) return

        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/sessions/${selectedSession}/messages?key=${API_KEY}`)

                if (res.ok) {
                    const data = await res.json()
                    setMessages(data.messages)
                }
            } catch (e) {
                console.error('Failed to fetch messages:', e)
            }
        }

        fetchMessages()
    }, [selectedSession])

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="text-gray-400">Loading sessions...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Sessions</h2>
                    <p className="text-gray-400 mb-4">Cannot fetch sessions from API</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-kamino-accent rounded-lg text-white hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white">Session Manager</h1>

            <div className="grid grid-cols-2 gap-6">
                {/* Sessions List */}
                <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                    <div className="p-4 border-b border-kamino-700">
                        <h2 className="font-semibold text-white">Active Sessions ({sessions.length})</h2>
                    </div>
                    <div className="divide-y divide-kamino-700 max-h-[600px] overflow-y-auto">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => setSelectedSession(session.id)}
                                className={`p-4 cursor-pointer hover:bg-kamino-700/50 transition-colors ${selectedSession === session.id ? 'bg-kamino-700' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <StatusDot status={session.status} />
                                        <span className="font-medium text-white">{session.user}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{session.agent}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">{session.messageCount} messages</span>
                                    <span className={`font-medium ${session.cost > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                        {session.cost > 0 ? `$${session.cost.toFixed(2)}` : 'Free'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{session.model}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversation View */}
                <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                    <div className="p-4 border-b border-kamino-700">
                        <h2 className="font-semibold text-white">
                            {selectedSession ? 'Conversation History' : 'Select a Session'}
                        </h2>
                    </div>
                    <div className="p-4 space-y-3 max-h-[540px] overflow-y-auto">
                        {selectedSession ? (
                            messages.length > 0 ? (
                                messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg ${msg.role === 'user'
                                            ? 'bg-kamino-700 ml-12'
                                            : 'bg-blue-900/30 mr-12'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-gray-400">
                                                {msg.role === 'user' ? 'USER' : 'ASSISTANT'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300">{msg.content}</p>
                                        {msg.tokens && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {msg.tokens} tokens • ${msg.cost?.toFixed(4)}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-8">No messages yet</div>
                            )
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Select a session to view conversation
                            </div>
                        )}
                    </div>
                    {selectedSession && (
                        <div className="p-4 border-t border-kamino-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 bg-kamino-700 border border-kamino-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kamino-accent"
                                />
                                <button className="px-4 py-2 bg-kamino-accent hover:bg-blue-600 rounded-lg text-white flex items-center gap-2">
                                    <Send size={16} />
                                    Send
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatusDot({ status }: { status: string }) {
    const color = status === 'active' ? 'bg-green-500' : status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
    return <div className={`w-2 h-2 rounded-full ${color}`} />
}
