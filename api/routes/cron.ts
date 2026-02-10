import { Hono } from 'hono'

const app = new Hono()

// Mock cron jobs
const mockJobs = [
    { id: 'daily-standup', name: 'Daily Standup', schedule: '0 9 * * *', enabled: true, lastRun: new Date(Date.now() - 3600000).toISOString(), nextRun: new Date(Date.now() + 79200000).toISOString(), agent: 'main-agent' },
    { id: 'heartbeat', name: 'Heartbeat Check', schedule: '*/30 * * * *', enabled: true, lastRun: new Date(Date.now() - 1800000).toISOString(), nextRun: new Date(Date.now() + 600000).toISOString(), agent: 'security-agent' },
    { id: 'backup', name: 'Backup Task', schedule: '0 0 * * *', enabled: false, lastRun: null, nextRun: null, agent: 'admin-agent' }
]

// GET /api/cron/jobs - List cron jobs
app.get('/jobs', (c) => {
    const enabled = c.req.query('enabled')

    let jobs = [...mockJobs]
    if (enabled !== undefined) {
        jobs = jobs.filter(j => j.enabled === (enabled === 'true'))
    }

    return c.json({ jobs })
})

// POST /api/cron/:id/trigger - Manually trigger job
app.post('/:id/trigger', (c) => {
    const id = c.req.param('id')

    const job = mockJobs.find(j => j.id === id)
    if (!job) {
        return c.json({ error: 'Job not found' }, 404)
    }

    // In production: actually trigger the cron job
    job.lastRun = new Date().toISOString()

    return c.json({ success: true, message: `Job ${id} triggered`, jobId: `run-${Date.now()}` })
})

// PATCH /api/cron/:id - Toggle job enabled/disabled
app.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()

    const job = mockJobs.find(j => j.id === id)
    if (!job) {
        return c.json({ error: 'Job not found' }, 404)
    }

    job.enabled = body.enabled

    return c.json({ success: true, job })
})

export const cronRoutes = app
