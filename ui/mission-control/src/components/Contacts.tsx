import { Users, UserPlus, Edit, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API_BASE_URL, API_KEY } from '../config/api'

interface Contact {
    id: string
    phone: string
    name: string
    category: string
    lastActivity: string
    messageCount: number
}

export default function Contacts() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchContacts()
    }, [filter])

    const fetchContacts = async () => {
        try {
            const url = filter === 'all'
                ? `${API_BASE_URL}/api/contacts?key=${API_KEY}`
                : `${API_BASE_URL}/api/contacts?key=${API_KEY}&category=${filter}`

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setContacts(data.contacts)
            }
        } catch (e) {
            console.error('Failed to fetch contacts:', e)
        } finally {
            setLoading(false)
        }
    }

    const updateCategory = async (id: string, category: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/contacts/${id}?key=${API_KEY}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category })
            })
            if (res.ok) fetchContacts()
        } catch (e) {
            console.error('Failed to update contact:', e)
        }
    }

    if (loading) {
        return <div className="p-6 text-gray-400">Loading contacts...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Contacts & Access Control</h1>
                <button className="px-4 py-2 bg-kamino-accent hover:bg-blue-600 rounded-lg text-white flex items-center gap-2">
                    <UserPlus size={18} />
                    Add Contact
                </button>
            </div>

            <div className="flex gap-2">
                {['all', 'admin', 'trusted', 'guest', 'blocked'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-lg transition-colors ${filter === cat
                            ? 'bg-kamino-accent text-white'
                            : 'bg-kamino-700 text-gray-400 hover:bg-kamino-600'
                            }`}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            <div className="bg-kamino-800 rounded-lg border border-kamino-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-kamino-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">NAME</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">PHONE</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">CATEGORY</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">MESSAGES</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">LAST ACTIVITY</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-kamino-700">
                        {contacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-kamino-700/50">
                                <td className="px-4 py-3 text-sm text-white">{contact.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-400">{contact.phone}</td>
                                <td className="px-4 py-3">
                                    <select
                                        value={contact.category}
                                        onChange={(e) => updateCategory(contact.id, e.target.value)}
                                        className="text-xs px-2 py-1 rounded-full bg-kamino-700 border border-kamino-600 text-white"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="trusted">Trusted</option>
                                        <option value="guest">Guest</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-400">{contact.messageCount}</td>
                                <td className="px-4 py-3 text-sm text-gray-400">
                                    {new Date(contact.lastActivity).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button className="p-1 hover:bg-kamino-600 rounded">
                                        <Edit size={16} className="text-gray-400" />
                                    </button>
                                    <button className="p-1 hover:bg-kamino-600 rounded ml-2">
                                        <Trash2 size={16} className="text-red-400" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
