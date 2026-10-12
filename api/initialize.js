export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { email, amount, reference, customer, callbackUrl, metadata } = req.body || {};

  if (!email || !amount) {
    return res.status(400).json({ status: false, message: 'Email and amount are required' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({
      status: false,
      message: 'Serverless initialize not configured: PAYSTACK_SECRET_KEY is not set.',
    });
  }

  try {
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        reference: reference || `ORDER-${Date.now()}`,
        callback_url: callbackUrl,
        metadata: metadata || {
          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: customer?.fullName,
            },
            {
              display_name: 'Phone',
              variable_name: 'phone',
              value: customer?.phone,
            },
            {
              display_name: 'Delivery Address',
              variable_name: 'delivery_address',
              value: customer?.address,
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
      message: err instanceof Error ? err.message : 'Error communicating with Paystack',
    });
  }
}
