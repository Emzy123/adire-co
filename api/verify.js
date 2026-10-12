/**
 * Adire & Co - Serverless Transaction Verification
 * - Accepts ONLY ?reference= (no client-supplied expectedAmount)
 * - Retrieves stored server order by reference
 * - Calls Paystack /transaction/verify/:reference with SECRET key
 * - Marks order paid only if status === 'success', currency === 'NGN', and amount === stored server total
 * - Returns clean JSON: { verified: true/false, status }
 * - Never returns secret data or uncaught exceptions.
 */

import { getOrder, updateOrderStatus } from './_lib/orderStore.js';

export default async function handler(req, res) {
  try {
    // CORS & Security headers
    const origin = req.headers?.origin;
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
        verified: false,
        status: 'method_not_allowed',
      });
    }

    // Accept ONLY ?reference=
    const reference = typeof req.query?.reference === 'string' ? req.query.reference.trim() : '';

    const refRegex = /^[A-Za-z0-9_-]{6,64}$/;
    if (!reference || !refRegex.test(reference)) {
      return res.status(200).json({
        verified: false,
        status: 'invalid_reference',
      });
    }

    // 1. Look up the stored order created on the server
    let storedOrder = null;
    try {
      storedOrder = await getOrder(reference);
    } catch (storeErr) {
      console.warn('[verify] getOrder error:', storeErr?.message || storeErr);
    }

    // If order reference is not found in store
    if (!storedOrder) {
      return res.status(200).json({
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
      console.warn('[verify] PAYSTACK_SECRET_KEY is not configured on the server.');
      return res.status(200).json({
        verified: false,
        status: 'server_configuration_error',
      });
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey.trim()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await paystackRes.json();

    if (!paystackRes.ok || !data.status || !data.data) {
      return res.status(200).json({
        verified: false,
        status: data?.data?.status || 'failed',
      });
    }

    const tx = data.data;
    const isSuccess = tx.status === 'success';
    const isNgn = tx.currency === 'NGN';
    const amountMatches = tx.amount === storedOrder.totalKobo;

    if (isSuccess && isNgn && amountMatches) {
      // Mark order paid in server store
      try {
        await updateOrderStatus(reference, 'paid', tx.paid_at || new Date().toISOString());
      } catch (e) {
        console.warn('[verify] updateOrderStatus error:', e?.message || e);
      }

      return res.status(200).json({
        verified: true,
        status: 'success',
      });
    }

    // Amount mismatch or not successful
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
    console.error('[verify] Unhandled error during verification:', err?.message || err);
    return res.status(200).json({
      verified: false,
      status: 'verification_error',
    });
  }
}
