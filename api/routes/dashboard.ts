import { Hono } from 'hono'
import { parseBillingLogs } from '../services/billing'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export const dashboardRoutes = new Hono()

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics
 */
dashboardRoutes.get('/stats', async (c) => {
    try {
        const entries = await parseBillingLogs(500)

        // Calculate today's stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEntries = entries.filter(e => new Date(e.timestamp) >= today)

        const totalTokens = todayEntries.reduce((sum, e) => sum + e.totalTokens, 0)
        const totalCost = todayEntries.reduce((sum, e) => sum + e.cost, 0)
        const requestCount = todayEntries.length

        // System metrics (basic)
        const freemem = os.freemem()
        const totalmem = os.totalmem()
        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100

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
            agents: [
                { id: 'main-agent', status: 'active', sessions: 2 },
                { id: 'guest-agent', status: 'active', sessions: 3 },
                { id: 'coder-agent', status: 'idle', sessions: 0 },
                { id: 'admin-agent', status: 'idle', sessions: 0 },
                { id: 'security-agent', status: 'idle', sessions: 0 },
            ],
        })
    } catch (error) {
        return c.json({ error: 'Failed to fetch dashboard stats' }, 500)
    }
})

/**
 * GET /api/dashboard/activity
 * Returns recent activity feed
 */
dashboardRoutes.get('/activity', async (c) => {
    try {
        const entries = await parseBillingLogs(20)

        const activity = entries.map(e => ({
            time: e.timestamp,
            user: e.user,
            action: `Sent message via ${e.session}`,
            tokens: e.totalTokens,
            cost: e.cost,
        }))

        return c.json({ activity })
    } catch (error) {
        return c.json({ error: 'Failed to fetch activity' }, 500)
    }
})
