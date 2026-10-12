/**
 * Adire & Co - Serverless Transaction Verification
 * Security Hardened: Strict Reference Validation, Amount Match Checking, Safe CORS
 */

function isOriginAllowed(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.vercel.app') ||
      (process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN)
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      status: false,
      message: 'Method not allowed. Use GET or POST.',
    });
  }

  const rawReference = req.query?.reference || (req.body && req.body.reference);
  const rawExpectedAmount = req.query?.expectedAmount || (req.body && req.body.expectedAmount);

  // 1. Reference validation
  const refRegex = /^[A-Za-z0-9_-]{6,64}$/;
  if (!rawReference || typeof rawReference !== 'string' || !refRegex.test(rawReference)) {
    return res.status(400).json({
      status: false,
      message: 'Invalid or missing transaction reference format.',
    });
  }

  // 2. Secret Key Check
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({
      status: false,
      message: 'Payment verification service is not configured: PAYSTACK_SECRET_KEY missing.',
    });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(rawReference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await paystackRes.json();

    if (!paystackRes.ok || !data.status) {
      return res.status(paystackRes.status).json({
        status: false,
        verified: false,
        message: data.message || 'Transaction could not be verified by Paystack.',
      });
    }

    const tx = data.data || {};
    const isSuccess = tx.status === 'success';
    const isNgn = tx.currency === 'NGN';

    // Amount match check against expected order total
    let amountMatches = true;
    if (rawExpectedAmount) {
      const expectedKobo = parseInt(rawExpectedAmount, 10);
      if (!isNaN(expectedKobo)) {
        amountMatches = tx.amount === expectedKobo;
      }
    }

    const verified = isSuccess && isNgn && amountMatches;

    return res.status(200).json({
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
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      verified: false,
      message: 'Failed to communicate with Paystack verification service.',
    });
  }
}
