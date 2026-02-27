const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PLAY_PRICE_CENTS = 100; // $1.00

// Create a PaymentIntent for a $1 token purchase
async function createPaymentIntent(userId, userEmail) {
  if (!stripe) {
    console.log(`[Payments] Stripe not configured - would charge $1.00 for ${userEmail}`);
    return {
      clientSecret: 'mock_secret',
      mock: true,
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount: PLAY_PRICE_CENTS,
    currency: 'usd',
    metadata: { userId },
    receipt_email: userEmail,
  });

  return { clientSecret: intent.client_secret };
}

// Verify Stripe webhook signature and construct event
function verifyWebhook(payload, signature) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

// Get Stripe publishable key for frontend
function getStripeConfig() {
  return {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
  };
}

module.exports = {
  createPaymentIntent,
  verifyWebhook,
  getStripeConfig,
  PLAY_PRICE_CENTS,
};
