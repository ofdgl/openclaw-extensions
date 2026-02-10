import { Hono } from 'hono'
const app = new Hono()
app.get('/jobs', (c) => c.json({ jobs: [] }))
app.post('/:id/trigger', (c) => c.json({ success: true }))
app.patch('/:id', async (c) => c.json({ success: true }))
export const cronRoutes = app
