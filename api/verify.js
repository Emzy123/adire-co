export default async function handler(req, res) {
  // Enable CORS if accessed
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

  const reference = req.query?.reference || (req.body && req.body.reference);

  if (!reference) {
    return res.status(400).json({ status: false, message: 'Missing transaction reference' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return res.status(503).json({
      status: false,
      message: 'Serverless verification not configured: PAYSTACK_SECRET_KEY is not set.',
    });
  }

  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await paystackRes.json();
    return res.status(paystackRes.status).json(data);
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err instanceof Error ? err.message : 'Error verifying transaction with Paystack',
    });
  }
}
