import { MessageSquare, /* Eye, */ Send, /* ExternalLink */ } from 'lucide-react'
import { useState } from 'react'
import type { Page } from '../App'

interface SessionManagerProps {
    onNavigate?: (page: Page) => void
}

const sessions = [
    {
        id: 'main-omer',
        channel: 'whatsapp',
        user: 'Ömer (+905357874261)',
        agent: 'main-agent',
        status: 'active',
        model: 'claude-sonnet-4-5',
        messages: 45,
        tokens: 89000,
        cost: 2.34,
        startedAt: '14:30',
        lastMessage: 'Token logs talep edildi',
    },
    {
        id: 'guest-ekrem',
        channel: 'whatsapp',
        user: 'Ekrem (+905070364656)',
        agent: 'guest-agent',
        status: 'active',
        model: 'gemini-2.0-flash',
        messages: 12,
        tokens: 3400,
        cost: 0.00,
        startedAt: '16:10',
        lastMessage: 'Merhaba, bugün hava nasıl?',
    },
    {
        id: 'guest-furkan',
        channel: 'whatsapp',
        user: 'Furkan (+905306310567)',
        agent: 'guest-agent',
        status: 'idle',
        model: 'openrouter/llama-3.2',
        messages: 8,
        tokens: 1200,
        cost: 0.00,
        startedAt: '15:45',
        lastMessage: 'Dosya gönder bana',
    },
    {
        id: 'telegram-omer',
        channel: 'telegram',
        user: 'Ömer (Telegram)',
        agent: 'main-agent',
        status: 'active',
        model: 'claude-sonnet-4-5',
        messages: 23,
        tokens: 45600,
        cost: 1.12,
        startedAt: '09:00',
        lastMessage: 'Rapor hazırla',
    },
]

const conversationMock = [
    { role: 'user', content: 'Bugün neler yaptık?', time: '18:15', model: null, tokens: 0, cost: 0 },
    { role: 'assistant', content: 'Bugün şu işleri tamamladık:\n1. Playwright kurulumu\n2. Free model testi\n3. SOUL.md admin fix', time: '18:15', model: 'claude-sonnet-4-5', tokens: 145, cost: 0.0012 },
    { role: 'user', content: 'Token loglarını göster', time: '18:20', model: null, tokens: 0, cost: 0 },
    { role: 'assistant', content: 'Bugünkü token kullanımı: 145,890 token, $2.34 maliyet.', time: '18:20', model: 'claude-sonnet-4-5', tokens: 89, cost: 0.0008 },
]

export default function SessionManager({ onNavigate }: SessionManagerProps) {
    const [selectedSession, setSelectedSession] = useState<string | null>(null)
    const [messageInput, setMessageInput] = useState('')

    const selected = sessions.find(s => s.id === selectedSession)

    return (
        <div className="p-6 h-full flex gap-6">
            {/* Session List */}
            <div className="w-80 space-y-4 shrink-0">
                <h1 className="text-2xl font-bold text-white">Sessions</h1>

                <div className="space-y-2">
                    {sessions.map((session) => (
                        <button
                            key={session.id}
                            onClick={() => setSelectedSession(session.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedSession === session.id
                                ? 'border-kamino-accent bg-kamino-accent/10'
                                : 'border-kamino-700 bg-kamino-800 hover:border-kamino-600'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-white text-sm">{session.user}</span>
                                <StatusDot status={session.status} />
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                                {session.agent} • {session.model}
                            </div>
                            <div className="text-xs text-gray-400 truncate mb-2">{session.lastMessage}</div>
                            <div className="flex items-center justify-between text-xs">
                                <span className={`px-1.5 py-0.5 rounded ${session.channel === 'whatsapp' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    {session.channel}
                                </span>
                                <span className="text-gray-500">{session.messages} msg • {(session.tokens / 1000).toFixed(1)}K tok</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                                Cost: {session.cost > 0 ? `$${session.cost.toFixed(4)}` : 'Free'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Conversation View */}
            <div className="flex-1 bg-kamino-800 rounded-lg border border-kamino-700 flex flex-col">
                {selected ? (
                    <>
                        {/* Session Header */}
                        <div className="p-4 border-b border-kamino-700">
                            <div className="font-semibold text-white">{selected.user}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Agent: {selected.agent} • Model: {selected.model} • Started: {selected.startedAt}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                                Total cost: {selected.cost > 0 ? `$${selected.cost.toFixed(4)}` : 'Free'}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                            {conversationMock.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md px-4 py-2 rounded-lg ${msg.role === 'user'
                                        ? 'bg-kamino-accent text-white'
                                        : 'bg-kamino-700 text-gray-200'
                                        }`}>
                                        <div className="text-sm whitespace-pre-line">{msg.content}</div>
                                        <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                                            <span>{msg.time}</span>
                                            {msg.role === 'assistant' && msg.cost > 0 && (
                                                <span className="ml-2 text-orange-400">
                                                    {msg.tokens} tok • ${msg.cost.toFixed(4)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-kamino-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Send message to session..."
                                    className="flex-1 px-4 py-2 bg-kamino-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-kamino-accent"
                                />
                                <button className="px-4 py-2 bg-kamino-accent rounded-lg text-white hover:bg-blue-600">
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                            <p>Bir session seçin</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatusDot({ status }: { status: string }) {
    const color = status === 'active' ? 'bg-green-500' : status === 'idle' ? 'bg-gray-500' : 'bg-red-500'
    return (
        <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${color} ${status === 'active' ? 'animate-pulse' : ''}`} />
            {status}
        </span>
    )
}
