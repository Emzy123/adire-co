import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            // Handle /api/initialize
            if (req.url?.startsWith('/api/initialize') && req.method === 'POST') {
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body || '{}')
                  const secretKey = env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY
                  if (!secretKey) {
                    res.writeHead(503, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: false, message: 'PAYSTACK_SECRET_KEY is not set in .env' }))
                    return
                  }
                  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${secretKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      email: data.email,
                      amount: data.amount,
                      reference: data.reference,
                      callback_url: data.callbackUrl,
                      metadata: data.metadata,
                    }),
                  })
                  const result = await paystackRes.json()
                  res.writeHead(paystackRes.status, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify(result))
                } catch (e: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ status: false, message: e.message }))
                }
              })
              return
            }

            // Handle /api/verify
            if (req.url?.startsWith('/api/verify')) {
              try {
                const url = new URL(req.url, 'http://localhost')
                const reference = url.searchParams.get('reference')
                const secretKey = env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY
                if (!secretKey) {
                  res.writeHead(503, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ status: false, message: 'PAYSTACK_SECRET_KEY is not set in .env' }))
                  return
                }
                const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference || '')}`, {
                  headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                  },
                })
                const result = await paystackRes.json()
                res.writeHead(paystackRes.status, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(result))
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ status: false, message: e.message }))
              }
              return
            }

            next()
          })
        },
      },
    ],
  }
})
