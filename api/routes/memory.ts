import { Hono } from 'hono'
const app = new Hono()
app.get('/files', (c) => c.json({ files: [] }))
app.get('/content', (c) => c.json({ path: '', content: '' }))
export const memoryRoutes = app
