import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/cron/jobs - List all cron jobs
app.get('/jobs', async (c) => {
    try {
        const jobsFile = path.join(process.env.HOME || '/root', '.openclaw/cron/jobs.json')

        try {
            const content = await fs.readFile(jobsFile, 'utf-8')
            const data = JSON.parse(content)

            const jobs = (data.jobs || []).map((job: any) => ({
                id: job.id,
                name: job.name || job.id,
                schedule: job.schedule?.cron || '* * * * *',
                enabled: job.enabled !== false,
                lastRun: job.state?.lastRunAtMs ? new Date(job.state.lastRunAtMs).toISOString() : null,
                nextRun: job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null,
                agent: job.targetAgent || 'main'
            }))

            return c.json({ jobs })
        } catch {
            return c.json({ jobs: [] })
        }
    } catch (error) {
        console.error('Failed to fetch cron jobs:', error)
        return c.json({ jobs: [] })
    }
})

// POST /api/cron/:id/trigger - Manual trigger (placeholder)
app.post('/:id/trigger', (c) => {
    return c.json({ success: true })
})

// PATCH /api/cron/:id - Update job (placeholder)
app.patch('/:id', async (c) => {
    return c.json({ success: true })
})

export const cronRoutes = app
