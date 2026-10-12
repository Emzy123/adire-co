import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import crypto from 'crypto'
import { computeOrderTotal } from './api/_lib/products.js'
import { saveOrder, getOrder, updateOrderStatus } from './api/_lib/orderStore.js'
import { sendOrderPaidEmail } from './api/_lib/email.js'

function sanitizeText(val: unknown, maxLen = 120): string {
  if (typeof val !== 'string') return ''
  return val
    .replace(/[<>'"`;]/g, '')
    .trim()
    .slice(0, maxLen)
}

function generateServerReference(): string {
  const timestamp = Date.now()
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `ADR-${timestamp}-${randomSuffix}`
}

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
            const urlPath = req.url ? req.url.split('?')[0] : ''

            // 1. Handle /api/initialize
            if (urlPath === '/api/initialize') {
              if (req.method !== 'POST') {
                res.writeHead(405, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ status: false, message: 'Method not allowed. Use POST.' }))
                return
              }

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

                  const { customer, items, callbackUrl } = data

                  if (!customer || typeof customer !== 'object') {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: false, message: 'Customer details are required.' }))
                    return
                  }

                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                  const rawEmail = typeof customer.email === 'string' ? customer.email.trim().toLowerCase() : ''
                  if (!rawEmail || !emailRegex.test(rawEmail)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: false, message: 'A valid email address is required.' }))
                    return
                  }

                  const cleanCustomer = {
                    fullName: sanitizeText(customer.fullName || customer.name, 80),
                    email: rawEmail,
                    phone: sanitizeText(customer.phone, 20),
                    address: sanitizeText(customer.address, 200),
                    note: sanitizeText(customer.note, 200),
                  }

                  if (!cleanCustomer.fullName || cleanCustomer.fullName.length < 2) {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: false, message: 'Customer full name is required.' }))
                    return
                  }

                  // Authoritative Server-side Price Computation
                  let computedPrice
                  try {
                    computedPrice = computeOrderTotal(items)
                  } catch (err: any) {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: false, message: err.message || 'Invalid items' }))
                    return
                  }

                  const reference = generateServerReference()

                  // Store order with status 'pending'
                  const newOrder = {
                    reference,
                    items: computedPrice.items,
                    subtotalNaira: computedPrice.subtotalNaira,
                    deliveryFeeNaira: computedPrice.deliveryFeeNaira,
                    totalNaira: computedPrice.totalNaira,
                    totalKobo: computedPrice.totalKobo,
                    customer: cleanCustomer,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                  }
                  await saveOrder(newOrder)

                  const safeCallbackUrl = callbackUrl || `http://${req.headers.host || 'localhost:5173'}/confirmation`

                  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${secretKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      email: cleanCustomer.email,
                      amount: computedPrice.totalKobo,
                      reference,
                      callback_url: safeCallbackUrl,
                      metadata: {
                        custom_fields: [
                          { display_name: 'Customer Name', variable_name: 'customer_name', value: cleanCustomer.fullName },
                          { display_name: 'Phone', variable_name: 'phone', value: cleanCustomer.phone },
                          { display_name: 'Delivery Address', variable_name: 'delivery_address', value: cleanCustomer.address },
                          { display_name: 'Order Note', variable_name: 'order_note', value: cleanCustomer.note || 'None' },
                        ],
                      },
                    }),
                  })

                  const result = await paystackRes.json()
                  if (!paystackRes.ok || !result.status || !result.data?.authorization_url) {
                    res.writeHead(paystackRes.status || 502, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: false, message: result.message || 'Paystack initialization failed' }))
                    return
                  }

                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({
                    status: true,
                    authorization_url: result.data.authorization_url,
                    reference,
                  }))
                } catch (e: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ status: false, message: 'Internal server error' }))
                }
              })
              return
            }

            // 2. Handle /api/verify (accepts ONLY ?reference=)
            if (urlPath === '/api/verify') {
              if (req.method !== 'GET') {
                res.writeHead(405, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ verified: false, status: 'method_not_allowed' }))
                return
              }

              try {
                const url = new URL(req.url || '', 'http://localhost')
                const reference = (url.searchParams.get('reference') || '').trim()

                const refRegex = /^[A-Za-z0-9_-]{6,64}$/
                if (!reference || !refRegex.test(reference)) {
                  res.writeHead(400, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ verified: false, status: 'invalid_reference' }))
                  return
                }

                const storedOrder = await getOrder(reference)
                if (!storedOrder) {
                  res.writeHead(404, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ verified: false, status: 'order_not_found' }))
                  return
                }

                if (storedOrder.status === 'paid') {
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ verified: true, status: 'success' }))
                  return
                }

                const secretKey = env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY
                if (!secretKey) {
                  res.writeHead(503, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ verified: false, status: 'server_configuration_error' }))
                  return
                }

                const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
                  headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                  },
                })
                const result = await paystackRes.json()

                if (!paystackRes.ok || !result.status || !result.data) {
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ verified: false, status: result.data?.status || 'failed' }))
                  return
                }

                const tx = result.data
                const isSuccess = tx.status === 'success'
                const isNgn = tx.currency === 'NGN'
                const amountMatches = tx.amount === storedOrder.totalKobo

                if (isSuccess && isNgn && amountMatches) {
                  await updateOrderStatus(reference, 'paid', tx.paid_at || new Date().toISOString())
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ verified: true, status: 'success' }))
                } else {
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ verified: false, status: tx.status || 'failed' }))
                }
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ verified: false, status: 'verification_error' }))
              }
              return
            }

            // 3. Handle /api/paystack-webhook
            if (urlPath === '/api/paystack-webhook') {
              if (req.method !== 'POST') {
                res.writeHead(405, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ status: false, message: 'Method not allowed. Use POST.' }))
                return
              }

              let rawBody = ''
              req.on('data', chunk => { rawBody += chunk })
              req.on('end', async () => {
                try {
                  const secretKey = env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY
                  if (!secretKey) {
                    res.writeHead(500, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: false, message: 'PAYSTACK_SECRET_KEY not set' }))
                    return
                  }

                  const signature = req.headers['x-paystack-signature']
                  if (!signature || typeof signature !== 'string') {
                    res.writeHead(401, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: false, message: 'Missing signature' }))
                    return
                  }

                  const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex')
                  if (hash !== signature) {
                    res.writeHead(401, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: false, message: 'Invalid signature' }))
                    return
                  }

                  const eventPayload = JSON.parse(rawBody || '{}')
                  const eventType = eventPayload?.event
                  const tx = eventPayload?.data

                  if (eventType === 'charge.success' && tx) {
                    const reference = tx.reference
                    if (reference) {
                      const order = await getOrder(reference)
                      if (order && order.status !== 'paid') {
                        const isSuccess = tx.status === 'success'
                        const isNgn = tx.currency === 'NGN'
                        const amountMatches = tx.amount === order.totalKobo

                        if (isSuccess && isNgn && amountMatches) {
                          await updateOrderStatus(reference, 'paid', tx.paid_at || new Date().toISOString())
                          try {
                            await sendOrderPaidEmail(order)
                          } catch (err) {
                            console.error('[webhook-dev] Failed sending email:', err)
                          }
                        }
                      }
                    }
                  }

                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ status: true, message: 'Webhook processed' }))
                } catch (e: any) {
                  res.writeHead(400, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ status: false, message: 'Malformed webhook payload' }))
                }
              })
              return
            }

            next()
          })
        },
      },
    ],
  }
})
