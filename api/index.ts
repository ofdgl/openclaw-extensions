import { serve } from '@hono/node-server'
import app from './server'

const port = 9347

console.log(`🚀 Kamino Mission Control API starting on port ${port}...`)

serve({
    fetch: app.fetch,
    port
})

console.log(`✅ API server running at http://localhost:${port}`)
console.log(`📊 Health check: http://localhost:${port}/health`)
