import { Hono } from 'hono'
import { parseBillingLogs } from '../services/billing'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export const dashboardRoutes = new Hono()

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics computed from session data
 */
dashboardRoutes.get('/stats', async (c) => {
    try {
        const home = process.env.HOME || '/root'
        const entries = await parseBillingLogs(500)

        // Calculate today's stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEntries = entries.filter(e => new Date(e.timestamp) >= today)

        const totalTokens = todayEntries.reduce((sum, e) => sum + e.totalTokens, 0)
        const totalCost = todayEntries.reduce((sum, e) => sum + e.cost, 0)
        const requestCount = entries.length // Total requests (all time)

        // System metrics
        const freemem = os.freemem()
        const totalmem = os.totalmem()
        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100

        // Get real agent data from sessions dir and SOULs
        const agents: any[] = []
        const agentsDir = path.join(home, '.openclaw/agents')
        try {
            const agentDirs = await fs.readdir(agentsDir)
            for (const agentId of agentDirs) {
                const agentPath = path.join(agentsDir, agentId)
                const stat = await fs.stat(agentPath)
                if (!stat.isDirectory()) continue

                let sessionCount = 0
                try {
                    const sessDir = path.join(agentPath, 'sessions')
                    const sessFiles = await fs.readdir(sessDir)
                    sessionCount = sessFiles.filter(f => f.endsWith('.jsonl') || f.endsWith('.json')).length
                } catch { }

                agents.push({
                    id: agentId,
                    status: sessionCount > 0 ? 'active' : 'idle',
                    sessions: sessionCount
                })
            }
        } catch { }

        // Add SOULs agents that might not have sessions
        const soulsDir = path.join(home, '.openclaw-active/souls')
        try {
            const souls = await fs.readdir(soulsDir)
            for (const soul of souls) {
                const soulId = soul.replace('.md', '')
                if (!agents.find(a => a.id === soulId)) {
                    agents.push({ id: soulId, status: 'idle', sessions: 0 })
                }
            }
        } catch { }

        return c.json({
            today: {
                totalTokens,
                totalCost,
                requestCount,
            },
            system: {
                cpu: cpuUsage.toFixed(1),
                ram: ((1 - freemem / totalmem) * 100).toFixed(1),
                uptime: os.uptime(),
            },
            agents,
        })
    } catch (error) {
        return c.json({ error: 'Failed to fetch dashboard stats' }, 500)
    }
})

/**
 * GET /api/dashboard/activity
 * Returns recent activity from session data
 */
dashboardRoutes.get('/activity', async (c) => {
    try {
        const entries = await parseBillingLogs(20)

        const activity = entries.map(e => ({
            time: e.timestamp,
            user: e.user,
            action: `API request (${e.model.split('/').pop()})`,
            tokens: e.totalTokens,
            cost: e.cost,
        }))

        return c.json({ activity })
    } catch (error) {
        return c.json({ error: 'Failed to fetch activity' }, 500)
    }
})
