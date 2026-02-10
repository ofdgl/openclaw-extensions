import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import CostTracker from './components/CostTracker'
import TokenLogs from './components/TokenLogs'
import Terminal from './components/Terminal'
import Settings from './components/Settings'
import SessionManager from './components/SessionManager'
import AgentManager from './components/AgentManager'
import HookManager from './components/HookManager'
import Contacts from './components/Contacts'
import LogViewer from './components/LogViewer'
import MemoryBrowser from './components/MemoryBrowser'
import CronTasks from './components/CronTasks'
import AccessGuard from './components/AccessGuard'

export type Page = 'dashboard' | 'cost' | 'tokens' | 'terminal' | 'settings' | 'sessions' | 'agents' | 'hooks' | 'contacts' | 'logs' | 'memory' | 'cron'

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

  const handleNavigate = (page: Page) => {
    setActivePage(page)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
      case 'cost': return <CostTracker />
      case 'tokens': return <TokenLogs onNavigate={handleNavigate} />
      case 'sessions': return <SessionManager onNavigate={handleNavigate} />
      case 'agents': return <AgentManager />
      case 'terminal': return <Terminal />
      case 'hooks': return <HookManager />
      case 'contacts': return <Contacts />
      case 'logs': return <LogViewer />
      case 'settings': return <Settings />
      case 'memory': return <MemoryBrowser />
      case 'cron': return <CronTasks />
      default: return <Dashboard />
    }
  }

  return (
    <AccessGuard>
      <div className="flex h-screen bg-kamino-900">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </AccessGuard>
  )
}

export default App
