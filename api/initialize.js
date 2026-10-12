/**
 * Adire & Co - Serverless Transaction Initializer
 * Security Hardened: Input Validation, Price Integrity Enforcement, CORS Protection
 */

const PRODUCT_PRICES = {
  '1': 12500, // Classic Indigo Adire Fabric (2 yards)
  '2': 15000, // Eleko Pattern Adire Fabric (2 yards)
  '3': 18500, // Adire Short-Sleeve Shirt
  '4': 32000, // Men's Adire Kaftan
  '5': 28000, // Adire Wrap Dress
  '6': 35000, // Adire Two-Piece Set
  '7': 8500,  // Adire Silk Scarf
  '8': 9500,  // Adire Canvas Tote Bag
};

const LAGOS_DELIVERY_FEE = 2500;

function sanitizeText(val, maxLen = 120) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[<>'"`;]/g, '') // Strip potential script/markup chars
    .trim()
    .slice(0, maxLen);
}

function isOriginAllowed(origin) {
  if (!origin) return true; // Same-origin or non-browser request
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
  // CORS configuration
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
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

  const { email, amount, reference, customer, callbackUrl, metadata, items } = req.body || {};

  // 1. Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!cleanEmail || !emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
    return res.status(400).json({
      status: false,
      message: 'A valid email address is required.',
    });
  }

  // 2. Authoritative Price Calculation & Tamper Protection
  let authoritativeAmountKobo = 0;
  if (Array.isArray(items) && items.length > 0) {
    let subtotal = 0;
    for (const item of items) {
      const pid = String(item.id || item.productId || '');
      const price = PRODUCT_PRICES[pid];
      if (!price) {
        return res.status(400).json({
          status: false,
          message: `Unknown product item in order: ${sanitizeText(pid, 20)}`,
        });
      }
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty < 1 || qty > 50) {
        return res.status(400).json({
          status: false,
          message: 'Invalid item quantity.',
        });
      }
      subtotal += price * qty;
    }
    authoritativeAmountKobo = (subtotal + LAGOS_DELIVERY_FEE) * 100;

    // Check if client supplied amount deviates from catalog calculations
    if (amount && Math.abs(parseInt(amount, 10) - authoritativeAmountKobo) > 0) {
      return res.status(400).json({
        status: false,
        message: 'Price tampering detected: order amount does not match catalog prices.',
      });
    }
  } else {
    // If items array is not provided, enforce strict integer amount bounds
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount < 100000 || parsedAmount > 50000000) { // ₦1,000 to ₦500,000
      return res.status(400).json({
        status: false,
        message: 'Invalid transaction amount.',
      });
    }
    authoritativeAmountKobo = parsedAmount;
  }

  // 3. Reference Validation & Sanitization
  const refRegex = /^[A-Za-z0-9_-]{6,64}$/;
  let safeReference = `ADR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  if (reference && typeof reference === 'string' && refRegex.test(reference)) {
    safeReference = reference;
  }

  // 4. Safe Customer Sanitization
  const safeCustomer = {
    fullName: sanitizeText(customer?.fullName, 80),
    phone: sanitizeText(customer?.phone, 20),
    address: sanitizeText(customer?.address, 200),
    note: sanitizeText(customer?.note, 200),
  };

  // 5. Secret Key Verification
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({
      status: false,
      message: 'Serverless payment gateway is not configured: PAYSTACK_SECRET_KEY missing.',
    });
  }

  // 6. Safe Callback URL Validation
  let safeCallbackUrl = undefined;
  if (typeof callbackUrl === 'string' && callbackUrl.length > 0) {
    try {
      const parsedUrl = new URL(callbackUrl);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        safeCallbackUrl = parsedUrl.toString();
      }
    } catch {
      safeCallbackUrl = undefined;
    }
  }

  try {
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
        callback_url: safeCallbackUrl,
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
    });

    const data = await paystackRes.json();
    return res.status(paystackRes.status).json(data);
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: 'Failed to communicate with Paystack payment gateway. Please try again.',
    });
  }
}
