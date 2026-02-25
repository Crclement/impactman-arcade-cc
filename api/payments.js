const { SquareClient, SquareEnvironment } = require('square');

// Initialize Square client
const squareClient = process.env.SQUARE_ACCESS_TOKEN
  ? new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
    })
  : null;

const LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const PLAY_PRICE_CENTS = 100; // $1.00

// Generate a unique idempotency key
function generateIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a payment for a play credit
async function createPayment(sourceId, userId, userEmail) {
  if (!squareClient) {
    console.log(`[Payments] Square not configured - would charge $1.00 for ${userEmail}`);
    return {
      success: true,
      mock: true,
      paymentId: `mock_${Date.now()}`,
    };
  }

  try {
    const response = await squareClient.payments.create({
      sourceId, // This comes from Apple Pay tokenization
      idempotencyKey: generateIdempotencyKey(),
      amountMoney: {
        amount: BigInt(PLAY_PRICE_CENTS),
        currency: 'USD',
      },
      locationId: LOCATION_ID,
      referenceId: userId,
      note: 'Impact Arcade - Play Credit',
      buyerEmailAddress: userEmail,
    });

    console.log(`[Payments] Payment successful: ${response.payment.id} for ${userEmail}`);

    return {
      success: true,
      paymentId: response.payment.id,
      receiptUrl: response.payment.receiptUrl,
    };
  } catch (err) {
    console.error(`[Payments] Payment failed:`, err);
    return {
      success: false,
      error: err.message || 'Payment failed',
    };
  }
}

// Get Square application ID for frontend
function getSquareConfig() {
  return {
    applicationId: process.env.SQUARE_APPLICATION_ID || null,
    locationId: LOCATION_ID || null,
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
  };
}

module.exports = {
  createPayment,
  getSquareConfig,
  PLAY_PRICE_CENTS,
};
