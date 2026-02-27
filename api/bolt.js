const crypto = require('crypto');

const PAYMENT_ENV = process.env.PAYMENT_ENV || 'sandbox';

const BOLT_URLS = {
  sandbox: {
    api: 'https://api-sandbox.bolt.com',
    cdn: 'https://connect-sandbox.bolt.com',
  },
  production: {
    api: 'https://api.bolt.com',
    cdn: 'https://connect.bolt.com',
  },
};

const urls = BOLT_URLS[PAYMENT_ENV] || BOLT_URLS.sandbox;

// Create a Bolt order token for a $1 cart
async function createOrderToken(userId, userEmail) {
  const apiKey = process.env.BOLT_API_KEY;
  if (!apiKey) {
    console.log(`[Bolt] API key not configured — returning mock token for ${userEmail}`);
    return { orderToken: 'mock_bolt_token', mock: true };
  }

  const orderPayload = {
    cart: {
      order_reference: `play_${userId}_${Date.now()}`,
      total: {
        amount: 100, // $1.00 in cents
        currency: 'USD',
        currency_symbol: '$',
      },
      items: [
        {
          name: 'Impact Arcade Play Token',
          reference: 'play_token',
          total_amount: 100,
          unit_price: 100,
          quantity: 1,
        },
      ],
    },
  };

  const res = await fetch(`${urls.api}/v1/merchant/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(orderPayload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bolt order creation failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return { orderToken: data.token || data.order_token };
}

// Verify Bolt webhook signature
function verifyBoltWebhook(payload, headers) {
  const secret = process.env.BOLT_SIGNING_SECRET;
  if (!secret) throw new Error('BOLT_SIGNING_SECRET not configured');

  const signature = headers['x-bolt-hmac-sha256'];
  if (!signature) throw new Error('Missing x-bolt-hmac-sha256 header');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('Invalid Bolt webhook signature');
  }

  return JSON.parse(payload);
}

// Get Bolt config for frontend
function getBoltConfig() {
  return {
    publishableKey: process.env.BOLT_PUBLISHABLE_KEY || null,
    cdnUrl: urls.cdn,
  };
}

module.exports = {
  createOrderToken,
  verifyBoltWebhook,
  getBoltConfig,
  PAYMENT_ENV,
};
