import { Hono } from 'hono'
import { parseBillingLogs, getCostSummary, getActivityHeatmap } from '../services/billing'

export const costRoutes = new Hono()

/**
 * GET /api/costs/summary?period=daily|weekly|monthly
 * Returns cost breakdown by period
 */
costRoutes.get('/summary', async (c) => {
    try {
        const entries = await parseBillingLogs(500)

        // Last 7 days for daily chart
        const dailyData: { day: string; cost: number; tokens: number }[] = []
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)

            const dayEntries = entries.filter(e => {
                const ed = new Date(e.timestamp)
                ed.setHours(0, 0, 0, 0)
                return ed.getTime() === date.getTime()
            })

            dailyData.push({
                day: days[date.getDay()],
                cost: dayEntries.reduce((s, e) => s + e.cost, 0),
                tokens: dayEntries.reduce((s, e) => s + e.totalTokens, 0)
            })
        }

        // Weekly and lifetime totals
        const weekCutoff = new Date()
        weekCutoff.setDate(weekCutoff.getDate() - 7)
        const weekEntries = entries.filter(e => new Date(e.timestamp) >= weekCutoff)

        const weeklyTotal = weekEntries.reduce((s, e) => s + e.cost, 0)
        const lifetimeTotal = entries.reduce((s, e) => s + e.cost, 0)
        const lifetimeDays = entries.length > 0 ?
            Math.ceil((Date.now() - new Date(entries[entries.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24))
            : 0

        // Model breakdown
        const modelStats: Record<string, { cost: number; tokens: number; count: number }> = {}
        weekEntries.forEach(e => {
            if (!modelStats[e.model]) modelStats[e.model] = { cost: 0, tokens: 0, count: 0 }
            modelStats[e.model].cost += e.cost
            modelStats[e.model].tokens += e.totalTokens
            modelStats[e.model].count++
        })

        const totalModelTokens = Object.values(modelStats).reduce((s, m) => s + m.tokens, 0)
        const models = Object.entries(modelStats).map(([model, stats]) => ({
            model: model.replace('anthropic/', '').replace('google/', ''),
            cost: stats.cost,
            percentage: totalModelTokens > 0 ? (stats.tokens / totalModelTokens) * 100 : 0,
            tokens: stats.tokens,
            color: model.includes('claude') ? 'bg-orange-500' : model.includes('gemini') ? 'bg-blue-500' : 'bg-green-500'
        }))

        // Session breakdown
        const sessionStats: Record<string, { cost: number; requests: number }> = {}
        weekEntries.forEach(e => {
            if (!sessionStats[e.session]) sessionStats[e.session] = { cost: 0, requests: 0 }
            sessionStats[e.session].cost += e.cost
            sessionStats[e.session].requests++
        })

        const sessions = Object.entries(sessionStats).map(([session, stats]) => ({
            session,
            cost: stats.cost,
            requests: stats.requests
        })).sort((a, b) => b.cost - a.cost).slice(0, 5)

        return c.json({
            daily: dailyData,
            weekly: {
                total: weeklyTotal,
                avg: weeklyTotal / 7
            },
            lifetime: {
                total: lifetimeTotal,
                days: lifetimeDays
            },
            models,
            sessions
        })
    } catch (error) {
        return c.json({ error: 'Failed to fetch cost summary' }, 500)
    }
})

/**
 * GET /api/costs/heatmap?days=7
 * Returns activity heatmap
 */
costRoutes.get('/heatmap', async (c) => {
    const numDays = parseInt(c.req.query('days') || '7')

    try {
        const heatmap = await getActivityHeatmap(numDays)
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

        return c.json({
            heatmap,
            days: days.slice(0, numDays)
        })
    } catch (error) {
        return c.json({ error: 'Failed to generate heatmap' }, 500)
    }
})
