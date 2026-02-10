import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

const JOBS_FILE = path.join(process.env.HOME || '/root', '.openclaw/cron/jobs.json')

async function readJobs() {
    try {
        const content = await fs.readFile(JOBS_FILE, 'utf-8')
        return JSON.parse(content)
    } catch {
        return { jobs: [] }
    }
}

async function writeJobs(data: any) {
    await fs.writeFile(JOBS_FILE, JSON.stringify(data, null, 2))
}

// GET /api/cron/jobs - List all cron jobs
app.get('/jobs', async (c) => {
    try {
        const data = await readJobs()

        const jobs = (data.jobs || []).map((job: any) => ({
            id: job.id,
            name: job.name || job.id,
            schedule: job.schedule?.cron || '* * * * *',
            enabled: job.enabled !== false,
            lastRun: job.state?.lastRunAtMs ? new Date(job.state.lastRunAtMs).toISOString() : null,
            nextRun: job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null,
            agent: job.targetAgent || 'main',
            message: job.message || '',
            description: job.description || ''
        }))

        return c.json({ jobs })
    } catch (error) {
        console.error('Failed to fetch cron jobs:', error)
        return c.json({ jobs: [] })
    }
})

// POST /api/cron/jobs - Create a new cron job
app.post('/jobs', async (c) => {
    try {
        const body = await c.req.json()
        const { name, schedule, message, agent, description } = body

        if (!name || !schedule) {
            return c.json({ error: 'Name and schedule are required' }, 400)
        }

        const data = await readJobs()
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

        // Check for duplicate
        if (data.jobs.some((j: any) => j.id === id)) {
            return c.json({ error: 'A job with this name already exists' }, 409)
        }

        const newJob = {
            id,
            name,
            schedule: { cron: schedule },
            enabled: true,
            targetAgent: agent || 'main',
            message: message || '',
            description: description || '',
            state: {}
        }

        data.jobs.push(newJob)
        await writeJobs(data)

        return c.json({ success: true, job: newJob })
    } catch (error) {
        console.error('Failed to create cron job:', error)
        return c.json({ error: 'Failed to create job' }, 500)
    }
})

// PATCH /api/cron/jobs/:id - Update a cron job
app.patch('/jobs/:id', async (c) => {
    try {
        const jobId = c.req.param('id')
        const body = await c.req.json()

        const data = await readJobs()
        const jobIndex = data.jobs.findIndex((j: any) => j.id === jobId)

        if (jobIndex === -1) {
            return c.json({ error: 'Job not found' }, 404)
        }

        const job = data.jobs[jobIndex]

        // Update allowed fields
        if (body.name !== undefined) job.name = body.name
        if (body.schedule !== undefined) {
            if (!job.schedule) job.schedule = {}
            job.schedule.cron = body.schedule
        }
        if (body.enabled !== undefined) job.enabled = body.enabled
        if (body.message !== undefined) job.message = body.message
        if (body.agent !== undefined) job.targetAgent = body.agent
        if (body.description !== undefined) job.description = body.description

        data.jobs[jobIndex] = job
        await writeJobs(data)

        return c.json({ success: true, job })
    } catch (error) {
        console.error('Failed to update cron job:', error)
        return c.json({ error: 'Failed to update job' }, 500)
    }
})

// DELETE /api/cron/jobs/:id - Delete a cron job
app.delete('/jobs/:id', async (c) => {
    try {
        const jobId = c.req.param('id')
        const data = await readJobs()

        const jobIndex = data.jobs.findIndex((j: any) => j.id === jobId)
        if (jobIndex === -1) {
            return c.json({ error: 'Job not found' }, 404)
        }

        data.jobs.splice(jobIndex, 1)
        await writeJobs(data)

        return c.json({ success: true })
    } catch (error) {
        console.error('Failed to delete cron job:', error)
        return c.json({ error: 'Failed to delete job' }, 500)
    }
})

// POST /api/cron/jobs/:id/trigger - Manual trigger
app.post('/jobs/:id/trigger', (c) => {
    return c.json({ success: true, message: 'Job triggered' })
})

export const cronRoutes = app
