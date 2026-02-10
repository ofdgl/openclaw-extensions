import { Hono } from 'hono'

const app = new Hono()

// Mock contacts data
let mockContacts = [
    { id: '1', phone: '+1234567890', name: 'John Doe', category: 'admin', lastActivity: new Date().toISOString(), messageCount: 145 },
    { id: '2', phone: '+0987654321', name: 'Jane Smith', category: 'trusted', lastActivity: new Date(Date.now() - 86400000).toISOString(), messageCount: 32 },
    { id: '3', phone: '+1122334455', name: 'Bob Wilson', category: 'guest', lastActivity: new Date(Date.now() - 172800000).toISOString(), messageCount: 8 }
]

// GET /api/contacts - List all contacts
app.get('/', (c) => {
    const category = c.req.query('category')

    let contacts = [...mockContacts]
    if (category) {
        contacts = contacts.filter(ct => ct.category === category)
    }

    return c.json({ contacts })
})

// POST /api/contacts - Add new contact
app.post('/', async (c) => {
    const body = await c.req.json()

    const newContact = {
        id: String(Date.now()),
        phone: body.phone,
        name: body.name || 'Unknown',
        category: body.category || 'guest',
        lastActivity: new Date().toISOString(),
        messageCount: 0
    }

    mockContacts.push(newContact)

    return c.json({ success: true, contact: newContact })
})

// PATCH /api/contacts/:id - Update contact
app.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()

    const contact = mockContacts.find(ct => ct.id === id)
    if (!contact) {
        return c.json({ error: 'Contact not found' }, 404)
    }

    if (body.category) contact.category = body.category
    if (body.name) contact.name = body.name

    return c.json({ success: true, contact })
})

// DELETE /api/contacts/:id - Delete contact
app.delete('/:id', (c) => {
    const id = c.req.param('id')
    const index = mockContacts.findIndex(ct => ct.id === id)

    if (index === -1) {
        return c.json({ error: 'Contact not found' }, 404)
    }

    mockContacts.splice(index, 1)

    return c.json({ success: true })
})

export const contactsRoutes = app
