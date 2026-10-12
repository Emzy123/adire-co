import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const PRODUCT_PRICES: Record<string, number> = {
  '1': 12500,
  '2': 15000,
  '3': 18500,
  '4': 32000,
  '5': 28000,
  '6': 35000,
  '7': 8500,
  '8': 9500,
};

const LAGOS_DELIVERY_FEE = 2500;

function sanitizeText(val: any, maxLen = 120): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[<>'"`;]/g, '')
    .trim()
    .slice(0, maxLen);
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
            // Handle /api/initialize
            if (req.url?.startsWith('/api/initialize')) {
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

                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                  const cleanEmail = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
                  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: false, message: 'A valid email address is required.' }))
                    return
                  }

                  // Price integrity check
                  let authoritativeAmountKobo = 0
                  if (Array.isArray(data.items) && data.items.length > 0) {
                    let subtotal = 0
                    for (const item of data.items) {
                      const pid = String(item.id || item.productId || '')
                      const price = PRODUCT_PRICES[pid]
                      if (!price) {
                        res.writeHead(400, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ status: false, message: `Unknown product ID: ${sanitizeText(pid, 20)}` }))
                        return
                      }
                      const qty = parseInt(item.quantity, 10)
                      if (isNaN(qty) || qty < 1 || qty > 50) {
                        res.writeHead(400, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ status: false, message: 'Invalid item quantity.' }))
                        return
                      }
                      subtotal += price * qty
                    }
                    authoritativeAmountKobo = (subtotal + LAGOS_DELIVERY_FEE) * 100
                  } else {
                    const parsedAmount = parseInt(data.amount, 10)
                    if (isNaN(parsedAmount) || parsedAmount < 100000 || parsedAmount > 50000000) {
                      res.writeHead(400, { 'Content-Type': 'application/json' })
                      res.end(JSON.stringify({ status: false, message: 'Invalid transaction amount.' }))
                      return
                    }
                    authoritativeAmountKobo = parsedAmount
                  }

                  const refRegex = /^[A-Za-z0-9_-]{6,64}$/
                  const safeReference = (data.reference && refRegex.test(data.reference))
                    ? data.reference
                    : `ADR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

                  const safeCustomer = {
                    fullName: sanitizeText(data.customer?.fullName, 80),
                    phone: sanitizeText(data.customer?.phone, 20),
                    address: sanitizeText(data.customer?.address, 200),
                    note: sanitizeText(data.customer?.note, 200),
                  }

                  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${secretKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      email: cleanEmail,
                      amount: authoritativeAmountKobo,
                      reference: safeReference,
                      callback_url: data.callbackUrl,
                      metadata: {
                        custom_fields: [
                          {
                            display_name: 'Customer Name',
                            variable_name: 'customer_name',
                            value: safeCustomer.fullName || 'Adire Customer',
                          },
                          {
                            display_name: 'Phone',
                            variable_name: 'phone',
                            value: safeCustomer.phone || 'N/A',
                          },
                          {
                            display_name: 'Delivery Address',
                            variable_name: 'delivery_address',
                            value: safeCustomer.address || 'Lagos, Nigeria',
                          },
                          {
                            display_name: 'Order Note',
                            variable_name: 'order_note',
                            value: safeCustomer.note || 'None',
                          },
                        ],
                      },
                    }),
                  })
                  const result = await paystackRes.json()
                  res.writeHead(paystackRes.status, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify(result))
                } catch (e: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ status: false, message: 'Internal server error' }))
                }
              })
              return
            }

            // Handle /api/verify
            if (req.url?.startsWith('/api/verify')) {
              try {
                const url = new URL(req.url, 'http://localhost')
                const reference = url.searchParams.get('reference')
                const expectedAmount = url.searchParams.get('expectedAmount')

                const refRegex = /^[A-Za-z0-9_-]{6,64}$/
                if (!reference || !refRegex.test(reference)) {
                  res.writeHead(400, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ status: false, message: 'Invalid reference format.' }))
                  return
                }

                const secretKey = env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY
                if (!secretKey) {
                  res.writeHead(503, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ status: false, message: 'PAYSTACK_SECRET_KEY is not set in .env' }))
                  return
                }

                const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
                  headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                  },
                })
                const result = await paystackRes.json()

                if (!paystackRes.ok || !result.status) {
                  res.writeHead(paystackRes.status, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ status: false, verified: false, message: result.message }))
                  return
                }

                const tx = result.data || {}
                const isSuccess = tx.status === 'success'
                const isNgn = tx.currency === 'NGN'
                let amountMatches = true
                if (expectedAmount) {
                  const expectedKobo = parseInt(expectedAmount, 10)
                  if (!isNaN(expectedKobo)) {
                    amountMatches = tx.amount === expectedKobo
                  }
                }

                const verified = isSuccess && isNgn && amountMatches

                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                  status: true,
                  verified,
                  amountMatches,
                  message: verified ? 'Payment successfully verified' : 'Payment verification failed',
                  data: {
                    id: tx.id,
                    status: tx.status,
                    reference: tx.reference,
                    amount: tx.amount,
                    currency: tx.currency,
                    channel: tx.channel,
                    gateway_response: tx.gateway_response,
                    paid_at: tx.paid_at,
                    customer: {
                      email: tx.customer?.email,
                      customer_code: tx.customer?.customer_code,
                    },
                  },
                }))
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ status: false, message: 'Internal server error' }))
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
