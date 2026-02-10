import { useState } from 'react'
import { Play, RefreshCw, ShieldCheck, Zap, Terminal as TerminalIcon } from 'lucide-react'
import { API_BASE_URL, API_KEY } from '../config/api'

const fastCommands = [
    {
        label: 'Check Status',
        command: 'openclaw status',
        icon: Play,
        color: 'blue'
    },
    {
        label: 'View Logs',
        command: 'tail -20 ~/.openclaw/gateway.log',
        icon: TerminalIcon,
        color: 'gray'
    },
    {
        label: 'List Files',
        command: 'ls -la ~/.openclaw/',
        icon: RefreshCw,
        color: 'purple'
    },
    {
        label: 'Check Processes',
        command: 'ps aux | grep openclaw',
        icon: ShieldCheck,
        color: 'green'
    },
    {
        label: 'Check Mode',
        command: 'cat ~/.openclaw/.env | grep MODE',
        icon: Zap,
        color: 'yellow'
    },
]

export default function Terminal() {
    const [output, setOutput] = useState<string[]>([
        '$ Kamino Terminal',
        '$ VPS: 76.13.137.215',
        '$ Type command or use Fast Commands',
        '',
    ])
    const [command, setCommand] = useState('')
    const [executing, setExecuting] = useState(false)

    const executeCommand = async (cmd: string) => {
        setOutput(prev => [...prev, `$ ${cmd}`])
        setExecuting(true)

        try {
            const res = await fetch(`${API_BASE_URL}/api/terminal/exec?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
            })

            const data = await res.json()

            if (data.success) {
                const lines = data.output.split('\n')
                setOutput(prev => [...prev, ...lines, ''])
            } else {
                const errorMsg = data.error || data.output || 'Unknown error'
                if (errorMsg.includes('not allowed') || errorMsg.includes('whitelist')) {
                    setOutput(prev => [...prev, '❌ WHITELIST ERROR:', errorMsg, '', '💡 Tip: Click "Show Whitelist" to see allowed commands', ''])
                } else {
                    setOutput(prev => [...prev, `❌ Error: ${errorMsg}`, ''])
                }
            }
        } catch (e: any) {
            setOutput(prev => [...prev, `Error: ${e.message}`, ''])
        } finally {
            setExecuting(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (command.trim() && !executing) {
            executeCommand(command.trim())
            setCommand('')
        }
    }

    return (
        <div className="p-6 h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Terminal</h1>
                <button
                    onClick={() => setOutput(prev => [...prev, '', '=== WHITELISTED COMMANDS ===', ...fastCommands.map(fc => `✓ ${fc.command}`), '===========================', ''])}
                    className="px-3 py-1 bg-kamino-700 hover:bg-kamino-600 rounded text-sm text-gray-300"
                >
                    Show Whitelist
                </button>
            </div>

            {/* Fast Commands */}
            <div className="flex gap-2 flex-wrap">
                {fastCommands.map((fc) => (
                    <button
                        key={fc.command}
                        onClick={() => executeCommand(fc.command)}
                        disabled={executing}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                            ${fc.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                                fc.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                                    fc.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                                        fc.color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                            'bg-gray-600 hover:bg-gray-700'} text-white`}
                    >
                        <fc.icon size={16} />
                        {fc.label}
                    </button>
                ))}
            </div>

            {/* Terminal Output */}
            <div className="flex-1 bg-black rounded-lg p-4 font-mono text-sm overflow-auto">
                {output.map((line, idx) => (
                    <div key={idx} className={line.startsWith('$') ? 'text-green-400' : line.startsWith('Error:') ? 'text-red-400' : 'text-gray-300'}>
                        {line}
                    </div>
                ))}
                {executing && <div className="text-yellow-400 animate-pulse">Executing...</div>}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    disabled={executing}
                    placeholder="Type a whitelisted command..."
                    className="flex-1 px-4 py-2 bg-kamino-800 border border-kamino-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kamino-accent disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!command.trim() || executing}
                    className="px-6 py-2 bg-kamino-accent hover:bg-blue-600 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Run
                </button>
            </form>
        </div>
    )
}
