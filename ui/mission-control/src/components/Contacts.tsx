import { Users, UserPlus, Edit, Trash2, MessageSquare } from 'lucide-react'
import { useState } from 'react'

const contacts = [
    {
        id: '1',
        name: 'Ömer',
        phone: '+905357874261',
        category: 'admin',
        addedAt: '2026-01-15',
        lastSeen: '1 min ago',
        messageCount: 234,
        rateLimit: { current: 3, max: 1000, window: '1 hour' },
    },
    {
        id: '2',
        name: 'Ekrem',
        phone: '+905070364656',
        category: 'trusted',
        addedAt: '2026-01-20',
        lastSeen: '10 min ago',
        messageCount: 45,
        rateLimit: { current: 2, max: 50, window: '1 hour' },
    },
    {
        id: '3',
        name: 'Furkan',
        phone: '+905306310567',
        category: 'guest',
        addedAt: '2026-02-01',
        lastSeen: '3 hours ago',
        messageCount: 12,
        rateLimit: { current: 8, max: 8, window: '1 hour' },
    },
]

const categories = [
    { id: 'admin', label: 'Admin', color: 'bg-red-500/20 text-red-400', description: 'Full access, no restrictions' },
    { id: 'trusted', label: 'Trusted', color: 'bg-green-500/20 text-green-400', description: 'Higher rate limits, main agent' },
    { id: 'guest', label: 'Guest', color: 'bg-gray-500/20 text-gray-400', description: 'Limited access, guest agent' },
    { id: 'blocked', label: 'Blocked', color: 'bg-red-500/20 text-red-400', description: 'No access' },
]

export default function Contacts() {
    const [filter, setFilter] = useState<string>('all')
    const [showAddModal, setShowAddModal] = useState(false)

    const filtered = filter === 'all' ? contacts : contacts.filter(c => c.category === filter)

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Contacts & Access Control</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-kamino-accent rounded-lg text-white hover:bg-blue-600"
                >
                    <UserPlus size={16} />
                    Add Contact
                </button>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs ${filter === 'all' ? 'bg-kamino-accent text-white' : 'bg-kamino-800 text-gray-400 border border-kamino-700'
                        }`}
                >
                    All ({contacts.length})
                </button>
                {categories.map(cat => {
                    const count = contacts.filter(c => c.category === cat.id).length
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-xs ${filter === cat.id ? 'bg-kamino-accent text-white' : 'bg-kamino-800 text-gray-400 border border-kamino-700'
                                }`}
                        >
                            {cat.label} ({count})
                        </button>
                    )
                })}
            </div>

            {/* Category Descriptions */}
            <div className="grid grid-cols-4 gap-3">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-kamino-800 rounded-lg p-3 border border-kamino-700">
                        <span className={`text-xs px-2 py-1 rounded ${cat.color}`}>{cat.label}</span>
                        <p className="text-xs text-gray-500 mt-2">{cat.description}</p>
                    </div>
                ))}
            </div>

            {/* Contacts List */}
            <div className="bg-kamino-800 rounded-lg border border-kamino-700">
                <table className="w-full">
                    <thead className="bg-kamino-700">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Contact</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Phone</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Category</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Rate Limit</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Last Seen</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-kamino-700">
                        {filtered.map((contact) => {
                            const ratePct = (contact.rateLimit.current / contact.rateLimit.max) * 100
                            const isNearLimit = ratePct >= 80
                            return (
                                <tr key={contact.id} className="hover:bg-kamino-700/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-kamino-600 flex items-center justify-center text-sm font-medium text-white">
                                                {contact.name[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm text-white font-medium">{contact.name}</div>
                                                <div className="text-xs text-gray-500">{contact.messageCount} messages</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-300">{contact.phone}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded ${categories.find(c => c.id === contact.category)?.color
                                            }`}>
                                            {contact.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-kamino-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${isNearLimit ? 'bg-red-500' : 'bg-green-500'}`}
                                                    style={{ width: `${ratePct}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs ${isNearLimit ? 'text-red-400' : 'text-gray-400'}`}>
                                                {contact.rateLimit.current}/{contact.rateLimit.max}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400">{contact.lastSeen}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-kamino-700 rounded">
                                                <MessageSquare size={14} />
                                            </button>
                                            <button className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-kamino-700 rounded">
                                                <Edit size={14} />
                                            </button>
                                            <button className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-kamino-700 rounded">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
