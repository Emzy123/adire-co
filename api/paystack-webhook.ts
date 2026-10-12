/**
 * Adire & Co - Paystack Webhook Handler
 * - Verifies x-paystack-signature using HMAC SHA512 of raw body with secret key
 * - On charge.success: checks amount matches stored server order
 * - Marks order as paid (idempotent: does nothing if already paid)
 * - Sends shop owner an email via Resend with complete order details
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { getOrder, updateOrderStatus } from './_lib/orderStore';
import { sendOrderPaidEmail } from './_lib/email';

// Disable Vercel's default body parser so we can read the exact raw body for HMAC verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method not allowed. Use POST.' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error('[webhook] PAYSTACK_SECRET_KEY is not configured on the server.');
    return res.status(500).json({ status: false, message: 'Webhook not configured.' });
  }

  // 1. Read raw body
  let rawBody = '';
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('[webhook] Failed to read raw body:', err);
    return res.status(400).json({ status: false, message: 'Could not read request body.' });
  }

  // 2. Verify x-paystack-signature with HMAC SHA512 of raw body
  const signature = req.headers['x-paystack-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(401).json({ status: false, message: 'Missing x-paystack-signature header.' });
  }

  const computedSignature = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  if (computedSignature !== signature) {
    console.warn('[webhook] Invalid signature rejected.');
    return res.status(401).json({ status: false, message: 'Invalid Paystack signature.' });
  }

  // 3. Parse JSON event
  let eventPayload: any;
  try {
    eventPayload = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).json({ status: false, message: 'Malformed JSON payload.' });
  }

  const eventType = eventPayload?.event;
  const tx = eventPayload?.data;

  // 4. Handle charge.success
  if (eventType === 'charge.success' && tx) {
    const reference = tx.reference;
    if (!reference) {
      return res.status(200).json({ status: true, message: 'No reference in transaction data' });
    }

    const order = await getOrder(reference);
    if (!order) {
      console.warn(`[webhook] Order with reference ${reference} not found in store.`);
      return res.status(200).json({ status: true, message: 'Order reference not tracked' });
    }

    // Idempotency: Do nothing if order is already marked paid
    if (order.status === 'paid') {
      return res.status(200).json({ status: true, message: 'Order already marked paid' });
    }

    // Verify amount, currency, and status
    const isSuccess = tx.status === 'success';
    const isNgn = tx.currency === 'NGN';
    const amountMatches = tx.amount === order.totalKobo;

    if (isSuccess && isNgn && amountMatches) {
      // Mark as paid
      order.status = 'paid';
      order.paidAt = tx.paid_at || new Date().toISOString();
      await updateOrderStatus(reference, 'paid', order.paidAt);

      // Send store owner an email with order details
      try {
        await sendOrderPaidEmail(order);
      } catch (emailErr) {
        console.error('[webhook] Error sending notification email:', emailErr);
      }

      console.log(`[webhook] Order ${reference} verified and marked paid.`);
      return res.status(200).json({ status: true, message: 'Order marked paid and owner notified' });
    } else {
      console.warn(
        `[webhook] Transaction verification mismatch for ${reference}. Expected amount: ${order.totalKobo}, got: ${tx.amount}`
      );
      return res.status(200).json({ status: true, message: 'Transaction conditions not met' });
    }
  }

  // Acknowledge other Paystack webhook events
  return res.status(200).json({ status: true, message: `Event ${eventType} received` });
}
