import { Hono } from 'hono'
const app = new Hono()
app.get('/', (c) => c.json({ contacts: [] }))
app.post('/', async (c) => c.json({ success: true, contact: {} }))
app.patch('/:id', async (c) => c.json({ success: true }))
app.delete('/:id', (c) => c.json({ success: true }))
export const contactsRoutes = app
