import {
    LayoutDashboard,
    Coins,
    Receipt,
    Terminal as TerminalIcon,
    Settings as SettingsIcon,
    MessageSquare,
    Bot,
    Plug,
    Users,
    ScrollText,
    FolderOpen,
    Clock,
    CheckCircle,
    Shield,
    Network
} from 'lucide-react'
import type { Page } from '../App'

interface SidebarProps {
    activePage: Page
    setActivePage: (page: Page) => void
}

const menuSections = [
    {
        title: 'Overview',
        items: [
            { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
            { id: 'cost' as Page, label: 'Cost Tracker', icon: Coins },
            { id: 'tokens' as Page, label: 'Message Logs', icon: Receipt },
        ]
    },
    {
        title: 'Operations',
        items: [
            { id: 'sessions' as Page, label: 'Sessions', icon: MessageSquare },
            { id: 'agents' as Page, label: 'Agents', icon: Bot },
            { id: 'routing' as Page, label: 'Routing', icon: Network },
            { id: 'terminal' as Page, label: 'Terminal', icon: TerminalIcon },
        ]
    },
    {
        title: 'Kamino Extensions',
        items: [
            { id: 'hooks' as Page, label: 'Hooks', icon: Plug },
            { id: 'contacts' as Page, label: 'Contacts', icon: Users },
            { id: 'logs' as Page, label: 'Log Viewer', icon: ScrollText },
        ]
    },
    {
        title: 'System',
        items: [
            { id: 'security' as Page, label: 'Security', icon: Shield },
            { id: 'settings' as Page, label: 'Settings', icon: SettingsIcon },
            { id: 'memory' as Page, label: 'Memory', icon: FolderOpen },
            { id: 'cron' as Page, label: 'Cron Jobs', icon: Clock },
        ]
    },
]

export default function Sidebar({ activePage, setActivePage }: SidebarProps) {
    return (
        <aside className="w-64 bg-kamino-800 border-r border-kamino-700 flex flex-col shrink-0">
            {/* Logo */}
            <div className="p-4 border-b border-kamino-700">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    🦞 Kamino
                </h1>
                <p className="text-xs text-gray-500 mt-1">Mission Control</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-auto py-2">
                {menuSections.map((section) => (
                    <div key={section.title} className="mb-2">
                        <div className="px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            {section.title}
                        </div>
                        <ul className="space-y-0.5 px-2">
                            {section.items.map((item) => {
                                const Icon = item.icon
                                const isActive = activePage === item.id
                                return (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => setActivePage(item.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${isActive
                                                ? 'bg-kamino-accent text-white'
                                                : 'text-gray-400 hover:bg-kamino-700 hover:text-white'
                                                }`}
                                        >
                                            <Icon size={16} />
                                            <span>{item.label}</span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Status Footer */}
            <div className="p-4 border-t border-kamino-700">
                <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={14} className="text-kamino-success" />
                    <span className="text-gray-400">Kamino Mode</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Gateway: Online</div>
            </div>
        </aside>
    )
}
