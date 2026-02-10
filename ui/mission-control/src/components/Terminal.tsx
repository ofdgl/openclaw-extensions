import { useState } from 'react'
import { Play, RefreshCw, /* Power, */ ShieldCheck, Zap } from 'lucide-react'

// Fast commands for quick access
const fastCommands = [
    {
        label: 'Restart Gateway',
        command: 'openclaw gateway restart',
        icon: RefreshCw,
        color: 'blue'
    },
    {
        label: 'Original Mode',
        command: '~/openclaw-extensions/scripts/mode-switch.sh original',
        icon: ShieldCheck,
        color: 'green'
    },
    {
        label: 'Kamino Mode',
        command: '~/openclaw-extensions/scripts/mode-switch.sh kamino',
        icon: Zap,
        color: 'purple'
    },
    {
        label: 'Check Status',
        command: 'openclaw status',
        icon: Play,
        color: 'yellow'
    },
    {
        label: 'View Logs',
        command: 'tail -f ~/.openclaw/gateway.log',
        icon: Play,
        color: 'gray'
    },
]

export default function Terminal() {
    const [output, setOutput] = useState<string[]>([
        '$ Welcome to Kamino Terminal',
        '$ Connected to VPS: 76.13.137.215',
        '$ Type a command or use Fast Commands above',
        '',
    ])
    const [command, setCommand] = useState('')

    const executeCommand = (cmd: string) => {
        setOutput(prev => [...prev, `$ ${cmd}`, 'Executing... (mock)'])
        // TODO: Connect to real backend WebSocket
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (command.trim()) {
            executeCommand(command)
            setCommand('')
        }
    }

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Terminal</h1>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-sm text-gray-400">Connected</span>
                </div>
            </div>

            {/* Fast Commands */}
            <div className="bg-kamino-800 rounded-lg p-4 border border-kamino-700">
                <h2 className="text-sm font-medium text-gray-400 mb-3">⚡ Fast Commands</h2>
                <div className="flex flex-wrap gap-2">
                    {fastCommands.map((cmd, i) => {
                        const Icon = cmd.icon
                        const colorClasses = {
                            blue: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/30',
                            green: 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/30',
                            purple: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/30',
                            yellow: 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/30',
                            gray: 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border-gray-500/30',
                        }[cmd.color]

                        return (
                            <button
                                key={i}
                                onClick={() => executeCommand(cmd.command)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${colorClasses}`}
                            >
                                <Icon size={14} />
                                <span className="text-sm">{cmd.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 bg-black rounded-lg border border-kamino-700 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 px-4 py-2 bg-kamino-800 border-b border-kamino-700">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-2 text-xs text-gray-500">root@srv1320265</span>
                </div>
                <div className="flex-1 p-4 font-mono text-sm text-green-400 overflow-auto">
                    {output.map((line, i) => (
                        <div key={i} className={line.startsWith('$') ? 'text-gray-400' : 'text-green-400'}>
                            {line || '\u00A0'}
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className="border-t border-kamino-700">
                    <div className="flex items-center">
                        <span className="px-4 text-green-400 font-mono text-sm">$</span>
                        <input
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="Enter command..."
                            className="flex-1 py-3 pr-4 bg-transparent text-green-400 font-mono text-sm placeholder-gray-600 focus:outline-none"
                        />
                    </div>
                </form>
            </div>
        </div>
    )
}
