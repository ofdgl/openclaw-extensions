import { useState } from 'react'
import { Shield, Users, Zap, Database, Save, RefreshCw } from 'lucide-react'

// Mock settings data
const initialSettings = {
    mode: 'kamino',
    dmPolicy: 'open',
    adminPhone: '+905357874261',
    hooks: {
        routerGuard: true,
        validatePhone: true,
        guestRouter: true,
        messageLogger: false,
    },
    modelFallback: ['claude-sonnet-4-5', 'gemini-2.0-flash', 'openrouter/llama-3.2'],
    contacts: [
        { name: 'Ömer', phone: '+905357874261', category: 'admin' },
        { name: 'Ekrem', phone: '+905070364656', category: 'trusted' },
        { name: 'Furkan', phone: '+905306310567', category: 'guest' },
    ]
}

export default function Settings() {
    const [settings, setSettings] = useState(initialSettings)
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        // TODO: Call API to save settings
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const toggleHook = (hook: keyof typeof settings.hooks) => {
        setSettings(prev => ({
            ...prev,
            hooks: { ...prev.hooks, [hook]: !prev.hooks[hook] }
        }))
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Kamino Settings</h1>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${saved
                            ? 'bg-green-500 text-white'
                            : 'bg-kamino-accent text-white hover:bg-blue-600'
                        }`}
                >
                    {saved ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            {/* Mode Selection */}
            <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                <div className="flex items-center gap-3 mb-4">
                    <Shield size={20} className="text-kamino-accent" />
                    <h2 className="text-lg font-semibold text-white">Operation Mode</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setSettings(prev => ({ ...prev, mode: 'kamino', dmPolicy: 'open' }))}
                        className={`p-4 rounded-lg border transition-colors ${settings.mode === 'kamino'
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-kamino-700 hover:border-kamino-600'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={18} className="text-purple-500" />
                            <span className="font-medium text-white">Kamino Mode</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            dmPolicy: open, hooks active, multi-user support
                        </p>
                    </button>
                    <button
                        onClick={() => setSettings(prev => ({ ...prev, mode: 'original', dmPolicy: 'pairing' }))}
                        className={`p-4 rounded-lg border transition-colors ${settings.mode === 'original'
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-kamino-700 hover:border-kamino-600'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Shield size={18} className="text-green-500" />
                            <span className="font-medium text-white">Original Mode</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            dmPolicy: pairing, admin only, maximum security
                        </p>
                    </button>
                </div>
            </div>

            {/* Hooks */}
            <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                <div className="flex items-center gap-3 mb-4">
                    <Zap size={20} className="text-yellow-500" />
                    <h2 className="text-lg font-semibold text-white">Hooks</h2>
                </div>
                <div className="space-y-3">
                    {Object.entries(settings.hooks).map(([hook, enabled]) => (
                        <div key={hook} className="flex items-center justify-between p-3 bg-kamino-700/50 rounded-lg">
                            <div>
                                <div className="font-medium text-white">{formatHookName(hook)}</div>
                                <div className="text-xs text-gray-500">{getHookDescription(hook)}</div>
                            </div>
                            <button
                                onClick={() => toggleHook(hook as keyof typeof settings.hooks)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-kamino-accent' : 'bg-kamino-600'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contacts */}
            <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                <div className="flex items-center gap-3 mb-4">
                    <Users size={20} className="text-green-500" />
                    <h2 className="text-lg font-semibold text-white">Contacts</h2>
                </div>
                <div className="space-y-2">
                    {settings.contacts.map((contact, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-kamino-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-kamino-600 flex items-center justify-center text-sm font-medium text-white">
                                    {contact.name[0]}
                                </div>
                                <div>
                                    <div className="font-medium text-white">{contact.name}</div>
                                    <div className="text-xs text-gray-500">{contact.phone}</div>
                                </div>
                            </div>
                            <CategoryBadge category={contact.category} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Model Fallback */}
            <div className="bg-kamino-800 rounded-lg p-6 border border-kamino-700">
                <div className="flex items-center gap-3 mb-4">
                    <Database size={20} className="text-blue-500" />
                    <h2 className="text-lg font-semibold text-white">Model Fallback Order</h2>
                </div>
                <div className="space-y-2">
                    {settings.modelFallback.map((model, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-kamino-700/50 rounded-lg">
                            <span className="w-6 h-6 flex items-center justify-center bg-kamino-600 rounded text-xs font-medium text-white">
                                {i + 1}
                            </span>
                            <span className="text-white">{model}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function CategoryBadge({ category }: { category: string }) {
    const classes = {
        admin: 'bg-red-500/20 text-red-400',
        trusted: 'bg-green-500/20 text-green-400',
        guest: 'bg-gray-500/20 text-gray-400',
    }[category] || 'bg-gray-500/20 text-gray-400'

    return (
        <span className={`text-xs px-2 py-1 rounded-full ${classes}`}>
            {category}
        </span>
    )
}

function formatHookName(hook: string): string {
    return hook.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

function getHookDescription(hook: string): string {
    const descriptions: Record<string, string> = {
        routerGuard: 'Route messages based on sender category',
        validatePhone: 'Validate incoming phone numbers',
        guestRouter: 'Route guest messages to guest agent',
        messageLogger: 'Log all messages to file',
    }
    return descriptions[hook] || ''
}
