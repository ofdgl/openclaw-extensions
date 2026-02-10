import { Hono } from 'hono'
const app = new Hono()
app.get('/', (c) => c.json({ hooks: [] }))
app.patch('/:id', async (c) => c.json({ success: true }))
export const hooksRoutes = app
