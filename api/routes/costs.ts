import { Hono } from 'hono'
import { getCostSummary, getActivityHeatmap } from '../services/billing'

export const costRoutes = new Hono()

/**
 * GET /api/costs/summary?period=daily|weekly|monthly
 * Returns cost breakdown by period
 */
costRoutes.get('/summary', async (c) => {
    const period = c.req.query('period') as 'daily' | 'weekly' | 'monthly' || 'daily'

    try {
        const summary = await getCostSummary(period)
        return c.json(summary)
    } catch (error) {
        return c.json({ error: 'Failed to fetch cost summary' }, 500)
    }
})

/**
 * GET /api/costs/heatmap?days=7
 * Returns activity heatmap
 */
costRoutes.get('/heatmap', async (c) => {
    const days = parseInt(c.req.query('days') || '7')

    try {
        const heatmap = await getActivityHeatmap(days)
        return c.json({ days, heatmap })
    } catch (error) {
        return c.json({ error: 'Failed to generate heatmap' }, 500)
    }
})
