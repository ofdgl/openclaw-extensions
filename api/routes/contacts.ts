import { Hono } from 'hono'
import fs from 'fs/promises'
import path from 'path'

const app = new Hono()

// GET /api/contacts - List all contacts
// Contacts are individual JSON files in ~/.openclaw/storage/contacts/
// Each file like: omer.json, +905070364656.json
// Format: { id, name, category, phone, created_at, last_seen, message_count }
app.get('/', async (c) => {
    try {
        const contactsDir = path.join(process.env.HOME || '/root', '.openclaw/storage/contacts')

        try {
            await fs.access(contactsDir)
        } catch {
            return c.json({ contacts: [] })
        }

        const files = await fs.readdir(contactsDir)
        const jsonFiles = files.filter(f => f.endsWith('.json'))

        const contacts: any[] = []

        for (const file of jsonFiles) {
            try {
                const filePath = path.join(contactsDir, file)
                const content = await fs.readFile(filePath, 'utf-8')
                const contact = JSON.parse(content)

                contacts.push({
                    id: contact.id || file.replace('.json', ''),
                    name: contact.name || contact.displayName || contact.pushName || file.replace('.json', ''),
                    phone: contact.phone || contact.id || '',
                    category: contact.category || 'unknown',
                    lastContact: contact.last_seen ? new Date(contact.last_seen).toISOString() : null,
                    messageCount: contact.message_count || 0,
                    createdAt: contact.created_at ? new Date(contact.created_at).toISOString() : null
                })
            } catch (e) {
                console.error(`Failed to parse contact file ${file}:`, e)
            }
        }

        return c.json({ contacts })
    } catch (error) {
        console.error('Failed to fetch contacts:', error)
        return c.json({ contacts: [] })
    }
})

// POST /api/contacts - Create/update contact
app.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const contactsDir = path.join(process.env.HOME || '/root', '.openclaw/storage/contacts')

        await fs.mkdir(contactsDir, { recursive: true })

        const fileName = `${body.phone || body.name || Date.now()}.json`
        const filePath = path.join(contactsDir, fileName)

        await fs.writeFile(filePath, JSON.stringify(body, null, 2))
        return c.json({ success: true, id: fileName.replace('.json', '') })
    } catch (error) {
        return c.json({ error: 'Failed to create contact' }, 500)
    }
})

// PATCH /api/contacts/:id - Update contact
app.patch('/:id', async (c) => {
    try {
        const contactId = c.req.param('id')
        const body = await c.req.json()
        const contactsDir = path.join(process.env.HOME || '/root', '.openclaw/storage/contacts')

        // Try to find file by id
        const files = await fs.readdir(contactsDir)
        const matchingFile = files.find(f => f.replace('.json', '') === contactId)

        if (!matchingFile) {
            return c.json({ error: 'Contact not found' }, 404)
        }

        const filePath = path.join(contactsDir, matchingFile)
        const existing = JSON.parse(await fs.readFile(filePath, 'utf-8'))
        const updated = { ...existing, ...body }

        await fs.writeFile(filePath, JSON.stringify(updated, null, 2))
        return c.json({ success: true })
    } catch (error) {
        return c.json({ error: 'Failed to update contact' }, 500)
    }
})

export const contactsRoutes = app
