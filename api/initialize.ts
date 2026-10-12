/**
 * Adire & Co - Serverless Payment Initializer
 * - Enforces server-side authoritative pricing (browser sends ONLY customer details and [{id, quantity}])
 * - Computes total in kobo (catalog item prices + ₦2,500 Lagos delivery fee)
 * - Generates unique server reference
 * - Persists order to server store with status 'pending'
 * - Calls Paystack's /transaction/initialize and returns only authorization_url and reference
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { computeOrderTotal } from './_lib/products';
import { saveOrder, StoredOrder } from './_lib/orderStore';

function sanitizeText(val: unknown, maxLen = 120): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[<>'"`;]/g, '')
    .trim()
    .slice(0, maxLen);
}

function generateServerReference(): string {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ADR-${timestamp}-${randomSuffix}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security headers
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      status: false,
      message: 'Method not allowed. Use POST.',
    });
  }

  const { customer, items, callbackUrl } = req.body || {};

  // 1. Validate customer details
  if (!customer || typeof customer !== 'object') {
    return res.status(400).json({
      status: false,
      message: 'Customer details (name, email, phone, address) are required.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const rawEmail = typeof customer.email === 'string' ? customer.email.trim().toLowerCase() : '';
  if (!rawEmail || !emailRegex.test(rawEmail) || rawEmail.length > 100) {
    return res.status(400).json({
      status: false,
      message: 'A valid customer email address is required.',
    });
  }

  const cleanCustomer = {
    fullName: sanitizeText(customer.fullName || customer.name, 80),
    email: rawEmail,
    phone: sanitizeText(customer.phone, 20),
    address: sanitizeText(customer.address, 200),
    note: sanitizeText(customer.note, 200),
  };

  if (!cleanCustomer.fullName || cleanCustomer.fullName.length < 2) {
    return res.status(400).json({
      status: false,
      message: 'Customer full name is required.',
    });
  }

  const phoneDigits = cleanCustomer.phone.replace(/[^0-9]/g, '');
  if (phoneDigits.length < 10) {
    return res.status(400).json({
      status: false,
      message: 'A valid customer phone number is required (at least 10 digits).',
    });
  }

  if (!cleanCustomer.address || cleanCustomer.address.length < 5) {
    return res.status(400).json({
      status: false,
      message: 'Delivery address in Lagos is required.',
    });
  }

  // 2. Validate cart items and compute authoritative server total
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      status: false,
      message: 'Cart items are required.',
    });
  }

  let computedPrice;
  try {
    computedPrice = computeOrderTotal(items);
  } catch (err: any) {
    return res.status(400).json({
      status: false,
      message: err.message || 'Invalid cart items or quantities.',
    });
  }

  // 3. Generate server reference
  const reference = generateServerReference();

  // 4. Verify Paystack Secret Key
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({
      status: false,
      message: 'PAYSTACK_SECRET_KEY is not configured on the server.',
    });
  }

  // 5. Save order in server store with status 'pending'
  const newOrder: StoredOrder = {
    reference,
    items: computedPrice.items,
    subtotalNaira: computedPrice.subtotalNaira,
    deliveryFeeNaira: computedPrice.deliveryFeeNaira,
    totalNaira: computedPrice.totalNaira,
    totalKobo: computedPrice.totalKobo,
    customer: cleanCustomer,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await saveOrder(newOrder);

  // 6. Safe callback URL (defaults to origin /confirmation)
  let safeCallbackUrl = callbackUrl;
  if (typeof safeCallbackUrl !== 'string' || !safeCallbackUrl) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    safeCallbackUrl = host ? `${proto}://${host}/confirmation` : undefined;
  }

  // 7. Call Paystack /transaction/initialize with server-computed amount
  try {
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
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: cleanCustomer.fullName,
            },
            {
              display_name: 'Phone',
              variable_name: 'phone',
              value: cleanCustomer.phone,
            },
            {
              display_name: 'Delivery Address',
              variable_name: 'delivery_address',
              value: cleanCustomer.address,
            },
            {
              display_name: 'Order Note',
              variable_name: 'order_note',
              value: cleanCustomer.note || 'None',
            },
          ],
        },
      }),
    });

    const data = await paystackRes.json();

    if (!paystackRes.ok || !data.status || !data.data?.authorization_url) {
      console.error('[initialize] Paystack API error:', data);
      return res.status(paystackRes.status || 502).json({
        status: false,
        message: data.message || 'Payment initialization failed with Paystack.',
      });
    }

    // Return ONLY authorization_url and reference to the browser
    return res.status(200).json({
      status: true,
      authorization_url: data.data.authorization_url,
      reference,
    });
  } catch (err: any) {
    console.error('[initialize] Network error calling Paystack:', err);
    return res.status(500).json({
      status: false,
      message: 'Could not connect to payment provider. Please try ordering via WhatsApp.',
    });
  }
}
