import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/contacts - List all contacts
app.get('/', async (c) => {
    try {
        const contactsFile = path.join(process.env.HOME || '/root', '.openclaw/storage/contacts')

        try {
            const content = await fs.readFile(contactsFile, 'utf-8')
            const data = JSON.parse(content)

            // Convert to array format
            const contacts = Object.values(data || {}).map((contact: any) => ({
                id: contact.id || contact.phoneNumber,
                name: contact.name || contact.displayName || 'Unknown',
                phone: contact.phoneNumber || contact.phone,
                category: contact.category || 'unknown',
                lastContact: contact.lastContact || null,
                messageCount: contact.messageCount || 0
            }))

            return c.json({ contacts })
        } catch {
            return c.json({ contacts: [] })
        }
    } catch (error) {
        console.error('Failed to fetch contacts:', error)
        return c.json({ contacts: [] })
    }
})

app.post('/', async (c) => c.json({ success: true, contact: {} }))
app.patch('/:id', async (c) => c.json({ success: true }))
app.delete('/:id', (c) => c.json({ success: true }))

export const contactsRoutes = app
