import { Hono } from 'hono'
const app = new Hono()
app.get('/', (c) => c.json({ agents: [] }))
app.get('/:id/outputs', (c) => c.json({ outputs: [] }))
app.get('/:id/memory', (c) => c.json({ soul: '', daily: '' }))
export const agentsRoutes = app
