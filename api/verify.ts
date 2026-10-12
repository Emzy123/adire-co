/**
 * Adire & Co - Serverless Transaction Verification
 * - Accepts ONLY ?reference= (no client-supplied expectedAmount)
 * - Retrieves stored server order by reference
 * - Calls Paystack /transaction/verify/:reference with SECRET key
 * - Marks order paid only if status === 'success', currency === 'NGN', and amount === stored server total
 * - Returns only { verified: true/false, status } to the browser
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOrder, updateOrderStatus } from './_lib/orderStore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security headers
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      status: false,
      message: 'Method not allowed. Use GET.',
    });
  }

  // Accept ONLY ?reference=
  const reference = typeof req.query.reference === 'string' ? req.query.reference.trim() : '';

  const refRegex = /^[A-Za-z0-9_-]{6,64}$/;
  if (!reference || !refRegex.test(reference)) {
    return res.status(400).json({
      verified: false,
      status: 'invalid_reference',
    });
  }

  // 1. Look up the stored order created on the server
  const storedOrder = await getOrder(reference);
  if (!storedOrder) {
    return res.status(404).json({
      verified: false,
      status: 'order_not_found',
    });
  }

  // If already marked paid (e.g. by webhook), return verified immediately
  if (storedOrder.status === 'paid') {
    return res.status(200).json({
      verified: true,
      status: 'success',
    });
  }

  // 2. Call Paystack API with secret key
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({
      verified: false,
      status: 'server_configuration_error',
    });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await paystackRes.json();

    if (!paystackRes.ok || !data.status || !data.data) {
      return res.status(200).json({
        verified: false,
        status: data.data?.status || 'failed',
      });
    }

    const tx = data.data;
    const isSuccess = tx.status === 'success';
    const isNgn = tx.currency === 'NGN';
    const amountMatches = tx.amount === storedOrder.totalKobo;

    if (isSuccess && isNgn && amountMatches) {
      // Mark order paid in server store
      await updateOrderStatus(reference, 'paid', tx.paid_at || new Date().toISOString());
      return res.status(200).json({
        verified: true,
        status: 'success',
      });
    }

    // Payment failed or amount mismatch
    if (!amountMatches) {
      console.warn(
        `[verify] Amount mismatch for order ${reference}: expected ${storedOrder.totalKobo}, got ${tx.amount}`
      );
    }

    return res.status(200).json({
      verified: false,
      status: tx.status || 'failed',
    });
  } catch (err) {
    console.error('[verify] Error verifying with Paystack:', err);
    return res.status(500).json({
      verified: false,
      status: 'verification_network_error',
    });
  }
}
