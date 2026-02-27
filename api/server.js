require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { sendWelcomeEmail, sendScoreClaimedEmail } = require('./email');
const { createPaymentIntent, verifyWebhook, getStripeConfig, PLAY_PRICE_CENTS } = require('./payments');
const { createOrderToken, verifyBoltWebhook, getBoltConfig, PAYMENT_ENV } = require('./bolt');
const db = require('./db');
const { generateToken, authMiddleware, adminMiddleware } = require('./auth');

// Active payment provider toggle (in-memory, default stripe)
let activePaymentProvider = 'stripe';

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for both Express and WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Track connected consoles (consoleId -> WebSocket) — kept in-memory (can't serialize WS)
const connectedConsoles = new Map();

// Console login sessions (consoleId -> { user, loggedInAt }) — ephemeral per-session
// Entries auto-expire after LOGIN_TTL_MS
const consoleLogins = new Map();
const LOGIN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getConsoleLogin(consoleId) {
  const entry = consoleLogins.get(consoleId);
  if (!entry) return null;
  if (Date.now() - new Date(entry.loggedInAt).getTime() > LOGIN_TTL_MS) {
    consoleLogins.delete(consoleId);
    return null;
  }
  return entry;
}

// Pending game starts (consoleId -> { userId, expiresAt }) — ephemeral, expires in 5 min
const pendingGameStarts = new Map();

app.use(cors());

// Stripe webhook needs raw body — must be registered BEFORE express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = verifyWebhook(req.body, signature);
  } catch (err) {
    console.error('[Payments] Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const userId = intent.metadata?.userId;

    if (userId) {
      try {
        const newCredits = await db.addCredit(userId);
        await db.addPayment(userId, intent.id, intent.amount / 100);

        console.log(`[Payments] Webhook: credit added for ${userId} (${intent.id}), now has ${newCredits} credits`);
      } catch (e) {
        console.error('[Payments] Webhook: failed to add credit:', e);
      }
    }
  }

  res.json({ received: true });
});

// Bolt webhook needs raw body — must be registered BEFORE express.json()
app.post('/api/payments/bolt/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = verifyBoltWebhook(req.body.toString(), req.headers);
  } catch (err) {
    console.error('[Bolt] Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const type = event.type || event.event;
  if (type === 'payment' || type === 'payment.completed') {
    const userId = event.reference || event.order?.cart?.order_reference?.split('_')[1];

    if (userId) {
      try {
        const newCredits = await db.addCredit(userId);
        const txnId = event.transaction_id || event.id || `bolt_${Date.now()}`;
        await db.addPayment(userId, txnId, 1.00);
        console.log(`[Bolt] Webhook: credit added for ${userId} (${txnId}), now has ${newCredits} credits`);
      } catch (e) {
        console.error('[Bolt] Webhook: failed to add credit:', e);
      }
    }
  }

  res.json({ received: true });
});

app.use(express.json());

// Serve static files from website/client/public
app.use(express.static(path.join(__dirname, '..', 'website', 'client', 'public'), {
  extensions: ['html']
}));

// ============================================
// WEBSOCKET HANDLING
// ============================================

wss.on('connection', (ws, req) => {
  let consoleId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Console registration
      if (data.type === 'register') {
        consoleId = data.consoleId;
        connectedConsoles.set(consoleId, ws);
        console.log(`[WS] Console connected: ${consoleId}`);

        // Send acknowledgment
        ws.send(JSON.stringify({ type: 'registered', consoleId }));
      }

      // Game started confirmation
      if (data.type === 'gameStarted') {
        const pending = pendingGameStarts.get(consoleId);
        if (pending) {
          console.log(`[WS] Game started on ${consoleId} for user ${pending.userId}`);
          pendingGameStarts.delete(consoleId);
        }
      }

      // Game ended - save score
      if (data.type === 'gameEnded') {
        const { userId, score, level, bags } = data;
        if (userId) {
          // Auto-save score for logged-in player (async, fire-and-forget with logging)
          (async () => {
            try {
              const userRow = await db.findUserById(userId);
              if (!userRow) return;
              const user = db.formatUser(userRow);

              await db.addScore(userId, {
                consoleId,
                score: score || 0,
                level: level || 1,
                bags: bags || 0,
                plasticRemoved: (bags || 0) * 0.1,
                playedAt: new Date().toISOString(),
              });

              await db.updateUserTotals(userId, score || 0, bags || 0);

              console.log(`[WS] Score saved for ${user.email}: ${score} pts`);

              // Send score saved confirmation to console
              ws.send(JSON.stringify({
                type: 'scoreSaved',
                userId,
                score,
                userName: user.name,
              }));
            } catch (e) {
              console.error('[WS] Error saving score:', e);
            }
          })();
        }
      }
    } catch (e) {
      console.error('[WS] Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    if (consoleId) {
      connectedConsoles.delete(consoleId);
      console.log(`[WS] Console disconnected: ${consoleId}`);
    }
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err);
  });
});

// Helper: Send message to specific console
function sendToConsole(consoleId, message) {
  const ws = connectedConsoles.get(consoleId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// ============================================
// HELPERS
// ============================================

function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0,O,1,I to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateUserId() {
  return 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// generateToken is now imported from ./auth (JWT-based)

// ============================================
// CONSOLE STATUS ENDPOINTS (from Pi)
// ============================================

// Receive status updates from Pi consoles
app.post('/api/status', async (req, res) => {
  const status = req.body;

  if (!status.consoleId) {
    return res.status(400).json({ error: 'consoleId required' });
  }

  let statusLevel = 'online';
  if (status.temperature >= 70 || status.cpuUsage >= 90 || status.memoryUsage >= 90) {
    statusLevel = 'warning';
  }

  try {
    await db.upsertConsoleStatus({
      ...status,
      status: statusLevel,
    });

    console.log(`[${new Date().toISOString()}] Status: ${status.consoleId} - CPU ${status.cpuUsage}%, Temp ${status.temperature}°C`);
    res.json({ success: true });
  } catch (e) {
    console.error('[API] Error upserting console status:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ============================================
// GAME EVENTS ENDPOINTS (from web game)
// ============================================

// Game started
app.post('/api/game/start', async (req, res) => {
  const { consoleId } = req.body;

  if (!consoleId) {
    return res.status(400).json({ error: 'consoleId required' });
  }

  try {
    let stats = await db.getGameStats(consoleId);

    if (!stats) {
      stats = {
        consoleId,
        gamesPlayed: 0,
        highScore: 0,
        highScoreDate: null,
        totalScore: 0,
        avgScore: 0,
        isPlaying: false,
        currentLevel: 0,
        currentScore: 0,
        currentSessionStart: null,
      };
    }

    stats.gamesPlayed += 1;
    stats.isPlaying = true;
    stats.currentLevel = 1;
    stats.currentScore = 0;
    stats.currentSessionStart = Date.now();

    await db.upsertGameStats(consoleId, stats);

    console.log(`[${new Date().toISOString()}] Game START: ${consoleId} (Total games: ${stats.gamesPlayed})`);
    res.json({ success: true, gameNumber: stats.gamesPlayed });
  } catch (e) {
    console.error('[API] Error starting game:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Game progress update (level/score change)
app.post('/api/game/update', async (req, res) => {
  const { consoleId, level, score } = req.body;

  if (!consoleId) {
    return res.status(400).json({ error: 'consoleId required' });
  }

  try {
    const stats = await db.getGameStats(consoleId);
    if (!stats) {
      return res.status(404).json({ error: 'Console not found' });
    }

    stats.isPlaying = true;
    stats.currentLevel = level || stats.currentLevel;
    stats.currentScore = score || stats.currentScore;

    await db.upsertGameStats(consoleId, stats);
    res.json({ success: true });
  } catch (e) {
    console.error('[API] Error updating game:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Game ended
app.post('/api/game/end', async (req, res) => {
  const { consoleId, finalScore, level } = req.body;

  if (!consoleId) {
    return res.status(400).json({ error: 'consoleId required' });
  }

  try {
    const stats = await db.getGameStats(consoleId);
    if (!stats) {
      return res.status(404).json({ error: 'Console not found' });
    }

    // Update stats
    stats.isPlaying = false;
    stats.currentLevel = 0;
    stats.currentScore = 0;
    stats.currentSessionStart = null;
    stats.totalScore += finalScore || 0;
    stats.avgScore = stats.gamesPlayed > 0 ? Math.floor(stats.totalScore / stats.gamesPlayed) : 0;

    // Check for new high score
    let isNewHighScore = false;
    if (finalScore > stats.highScore) {
      stats.highScore = finalScore;
      stats.highScoreDate = new Date().toISOString();
      isNewHighScore = true;
    }

    await db.upsertGameStats(consoleId, stats);

    console.log(`[${new Date().toISOString()}] Game END: ${consoleId} - Score: ${finalScore}, Level: ${level}${isNewHighScore ? ' NEW HIGH SCORE!' : ''}`);
    res.json({ success: true, isNewHighScore, highScore: stats.highScore });
  } catch (e) {
    console.error('[API] Error ending game:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ============================================
// SESSION ENDPOINTS (QR Code Flow)
// ============================================

// Create a new game session (called at game over)
app.post('/api/sessions', async (req, res) => {
  const { consoleId, raspiId, score, level, bags, plasticRemoved } = req.body;

  if (!consoleId) {
    return res.status(400).json({ error: 'consoleId required' });
  }

  try {
    // Generate unique session code
    let code;
    let exists = true;
    while (exists) {
      code = generateSessionCode();
      exists = await db.sessionCodeExists(code);
    }

    const session = await db.createSession(code, {
      consoleId,
      raspiId: raspiId || null,
      eventId: req.body.eventId || null,
      eventDate: req.body.eventDate || null,
      score: score || 0,
      level: level || 1,
      bags: bags || 0,
      plasticRemoved: plasticRemoved || 0,
    });

    console.log(`[${new Date().toISOString()}] Session created: ${code} | Console: ${consoleId} | Raspi: ${raspiId || 'N/A'} | Score: ${score}`);

    res.json({
      success: true,
      code,
      claimUrl: `/claim/${code}`,
      session,
    });
  } catch (e) {
    console.error('[API] Error creating session:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get session info
app.get('/api/sessions/:code', async (req, res) => {
  try {
    const session = await db.getSession(req.params.code);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Session expired' });
    }

    res.json(session);
  } catch (e) {
    console.error('[API] Error getting session:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Claim a session (link to user account)
app.post('/api/sessions/:code/claim', async (req, res) => {
  const { email, name } = req.body;
  const code = req.params.code.toUpperCase();

  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }

  try {
    const session = await db.getSession(code);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.claimed) {
      return res.status(400).json({ error: 'Session already claimed' });
    }

    if (new Date(session.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Session expired' });
    }

    // Find or create user
    let userRow = await db.findUserByEmail(email);
    let isNewUser = false;

    if (!userRow) {
      const userId = generateUserId();
      userRow = await db.createUser(userId, email, name || email.split('@')[0]);
      isNewUser = true;
      console.log(`[${new Date().toISOString()}] New user: ${email} (${userId})`);
    }
    const user = db.formatUser(userRow);

    // Claim the session
    await db.claimSession(code, user.id);

    // Add score to user's history
    await db.addScore(user.id, {
      sessionCode: code,
      consoleId: session.consoleId,
      eventId: session.eventId,
      eventDate: session.eventDate,
      score: session.score,
      level: session.level,
      bags: session.bags,
      plasticRemoved: session.plasticRemoved,
      playedAt: session.createdAt,
      claimedAt: new Date().toISOString(),
    });

    // Update user totals
    const updatedRow = await db.updateUserTotals(user.id, session.score, session.bags);
    const updatedUser = db.formatUser(updatedRow);

    // Generate auth token
    const token = generateToken(user.id);

    // Send score claimed email
    sendScoreClaimedEmail(updatedUser, session).catch(err => {
      console.error('[API] Failed to send score claimed email:', err);
    });

    // Send welcome email for new users
    if (isNewUser) {
      sendWelcomeEmail(updatedUser).catch(err => {
        console.error('[API] Failed to send welcome email:', err);
      });
    }

    console.log(`[${new Date().toISOString()}] Session claimed: ${code} by ${updatedUser.email}`);

    res.json({
      success: true,
      user: updatedUser,
      token,
      session: { ...session, claimed: true, userId: user.id, claimedAt: new Date().toISOString() },
    });
  } catch (e) {
    console.error('[API] Error claiming session:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ============================================
// USER ENDPOINTS
// ============================================

// Login/signup with email
app.post('/api/users/login', async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }

  try {
    let userRow = await db.findUserByEmail(email);
    let isNewUser = false;

    if (!userRow) {
      const userId = generateUserId();
      userRow = await db.createUser(userId, email, name || email.split('@')[0]);
      isNewUser = true;
      console.log(`[${new Date().toISOString()}] New user signup: ${email}`);
    }

    const user = db.formatUser(userRow);
    const token = generateToken(user.id);

    // Send welcome email for new users
    if (isNewUser) {
      sendWelcomeEmail(user).catch(err => {
        console.error('[API] Failed to send welcome email:', err);
      });
    }

    res.json({
      success: true,
      user,
      token,
      isNewUser,
    });
  } catch (e) {
    console.error('[API] Error during login:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const userRow = await db.findUserById(req.params.id);

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = db.formatUser(userRow);
    const scores = await db.getUserScores(user.id);
    const highScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;

    res.json({
      ...user,
      highScore,
      scores: scores.slice(0, 10), // Already ordered DESC
    });
  } catch (e) {
    console.error('[API] Error getting user:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get user's score history
app.get('/api/users/:id/scores', async (req, res) => {
  try {
    const userRow = await db.findUserById(req.params.id);

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = db.formatUser(userRow);
    const scores = await db.getUserScores(user.id);

    res.json({
      user,
      scores,
      stats: {
        totalGames: scores.length,
        totalScore: user.totalScore,
        totalBags: user.totalBags,
        highScore: scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0,
        avgScore: scores.length > 0 ? Math.floor(user.totalScore / scores.length) : 0,
      },
    });
  } catch (e) {
    console.error('[API] Error getting user scores:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Save score directly for logged-in users (no session/claim needed)
app.post('/api/users/:id/scores', authMiddleware, async (req, res) => {
  // Verify the authenticated user matches the route param
  if (req.userId !== req.params.id) {
    return res.status(403).json({ error: 'Not authorized to save scores for this user' });
  }

  try {
    const userRow = await db.findUserById(req.params.id);

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { consoleId, raspiId, score, level, bags, plasticRemoved, idempotencyKey } = req.body;

    const result = await db.addScore(userRow.id, {
      consoleId: consoleId || 'IMP-001',
      eventId: req.body.eventId || null,
      eventDate: req.body.eventDate || null,
      score: score || 0,
      level: level || 1,
      bags: bags || 0,
      plasticRemoved: plasticRemoved || 0,
      playedAt: new Date().toISOString(),
      claimedAt: new Date().toISOString(),
      idempotencyKey: idempotencyKey || null,
    });

    // If duplicate idempotency key, return success without updating totals
    if (result.duplicate) {
      const user = db.formatUser(userRow);
      console.log(`[${new Date().toISOString()}] Duplicate score (idempotency: ${idempotencyKey}) for ${user.email}`);
      return res.json({ success: true, user, duplicate: true });
    }

    // Update user totals
    const updatedRow = await db.updateUserTotals(userRow.id, score || 0, bags || 0);
    const user = db.formatUser(updatedRow);

    console.log(`[${new Date().toISOString()}] Score saved for ${user.email}: ${score || 0} (Level ${level || 1})`);

    res.json({
      success: true,
      user,
      scoreEntry: {
        consoleId: consoleId || 'IMP-001',
        score: score || 0,
        level: level || 1,
        bags: bags || 0,
        plasticRemoved: plasticRemoved || 0,
        playedAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error('[API] Error saving score:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ============================================
// PAYMENT ENDPOINTS (Stripe Payment Element)
// ============================================

// Get payment config for frontend (active provider + all provider keys)
app.get('/api/payments/config', (req, res) => {
  const stripeConfig = getStripeConfig();
  const boltConfig = getBoltConfig();

  res.json({
    environment: PAYMENT_ENV,
    activeProvider: activePaymentProvider,
    pricePerPlay: PLAY_PRICE_CENTS / 100,
    currency: 'USD',
    // Legacy field for backwards compat
    publishableKey: stripeConfig.publishableKey,
    providers: {
      stripe: {
        configured: !!stripeConfig.publishableKey,
        publishableKey: stripeConfig.publishableKey,
      },
      bolt: {
        configured: !!boltConfig.publishableKey,
        publishableKey: boltConfig.publishableKey,
        cdnUrl: boltConfig.cdnUrl,
      },
    },
  });
});

// Get user's play credits
app.get('/api/users/:id/credits', async (req, res) => {
  try {
    const userRow = await db.findUserById(req.params.id);

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const credits = await db.getCredits(userRow.id);
    const payments = await db.getUserPayments(userRow.id);

    // If they haven't used their free play, they have 1 available
    const availablePlays = credits.freePlayUsed ? credits.credits : credits.credits + 1;

    res.json({
      userId: userRow.id,
      freePlayUsed: credits.freePlayUsed,
      paidCredits: credits.credits,
      availablePlays,
      payments,
    });
  } catch (e) {
    console.error('[API] Error getting credits:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Create a Stripe PaymentIntent
app.post('/api/payments/create-intent', authMiddleware, async (req, res) => {
  try {
    const userRow = await db.findUserById(req.userId);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await createPaymentIntent(req.userId, userRow.email);

    if (result.mock) {
      // Stripe not configured — add credit directly (dev mode)
      const newCredits = await db.addCredit(req.userId);
      await db.addPayment(req.userId, `mock_${Date.now()}`, PLAY_PRICE_CENTS / 100);
      const credits = await db.getCredits(req.userId);

      console.log(`[${new Date().toISOString()}] Mock payment: ${userRow.email} now has ${newCredits} credits`);

      return res.json({
        success: true,
        mock: true,
        credits: newCredits,
        availablePlays: credits.freePlayUsed ? newCredits : newCredits + 1,
      });
    }

    console.log(`[${new Date().toISOString()}] PaymentIntent created for ${userRow.email}`);

    res.json({
      clientSecret: result.clientSecret,
    });
  } catch (e) {
    console.error('[API] Error creating PaymentIntent:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Create Bolt order token
app.post('/api/payments/bolt/order-token', authMiddleware, async (req, res) => {
  try {
    const userRow = await db.findUserById(req.userId);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await createOrderToken(req.userId, userRow.email);

    if (result.mock) {
      // Bolt not configured — add credit directly (dev mode)
      const newCredits = await db.addCredit(req.userId);
      await db.addPayment(req.userId, `mock_bolt_${Date.now()}`, 1.00);
      const credits = await db.getCredits(req.userId);

      console.log(`[${new Date().toISOString()}] Mock Bolt payment: ${userRow.email} now has ${newCredits} credits`);

      return res.json({
        success: true,
        mock: true,
        credits: newCredits,
        availablePlays: credits.freePlayUsed ? newCredits : newCredits + 1,
      });
    }

    console.log(`[${new Date().toISOString()}] Bolt order token created for ${userRow.email}`);
    res.json({ orderToken: result.orderToken });
  } catch (e) {
    console.error('[API] Error creating Bolt order token:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Dev: Add a free credit (for testing)
app.post('/api/users/:id/dev-credit', async (req, res) => {
  try {
    const userRow = await db.findUserById(req.params.id);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newCredits = await db.addCredit(userRow.id);
    const credits = await db.getCredits(userRow.id);
    const availablePlays = credits.freePlayUsed ? credits.credits : credits.credits + 1;

    console.log(`[${new Date().toISOString()}] Dev credit added: ${userRow.email} now has ${newCredits} credits (${availablePlays} plays)`);

    res.json({
      success: true,
      credits: newCredits,
      availablePlays,
    });
  } catch (e) {
    console.error('[API] Error adding dev credit:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Use a play credit (called when starting a game)
app.post('/api/users/:id/use-credit', authMiddleware, async (req, res) => {
  try {
    const userRow = await db.findUserById(req.params.id);

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const credits = await db.getCredits(userRow.id);

    // Check if they have any plays available
    const availablePlays = credits.freePlayUsed ? credits.credits : credits.credits + 1;

    if (availablePlays <= 0) {
      return res.status(402).json({
        error: 'No play credits available',
        needsPayment: true,
      });
    }

    // Use a credit
    if (!credits.freePlayUsed) {
      await db.useFreePlay(userRow.id);
      console.log(`[${new Date().toISOString()}] Free play used: ${userRow.email}`);
    } else {
      await db.usePaidCredit(userRow.id);
      console.log(`[${new Date().toISOString()}] Paid credit used: ${userRow.email} (${credits.credits - 1} remaining)`);
    }

    const updatedCredits = await db.getCredits(userRow.id);

    res.json({
      success: true,
      creditsRemaining: updatedCredits.credits,
      freePlayUsed: updatedCredits.freePlayUsed,
      availablePlays: updatedCredits.freePlayUsed ? updatedCredits.credits : updatedCredits.credits + 1,
    });
  } catch (e) {
    console.error('[API] Error using credit:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ============================================
// CONSOLE GAME CONTROL (Phone → Console)
// ============================================

// Start game on a console (called from phone after scanning QR)
app.post('/api/consoles/:consoleId/start-game', async (req, res) => {
  const { consoleId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const userRow = await db.findUserById(userId);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = db.formatUser(userRow);

    // Check if console is connected
    if (!connectedConsoles.has(consoleId)) {
      return res.status(404).json({ error: 'Console not connected' });
    }

    // Check credits
    const credits = await db.getCredits(userId);
    const availablePlays = credits.freePlayUsed ? credits.credits : credits.credits + 1;

    if (availablePlays <= 0) {
      return res.status(402).json({
        error: 'No play credits available',
        needsPayment: true,
      });
    }

    // Use a credit
    if (!credits.freePlayUsed) {
      await db.useFreePlay(userId);
      console.log(`[${new Date().toISOString()}] Free play used: ${user.email} on ${consoleId}`);
    } else {
      await db.usePaidCredit(userId);
      console.log(`[${new Date().toISOString()}] Paid credit used: ${user.email} on ${consoleId} (${credits.credits - 1} remaining)`);
    }

    const updatedCredits = await db.getCredits(userId);

    // Store pending game start (in-memory)
    pendingGameStarts.set(consoleId, {
      userId,
      userName: user.name,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    // Also set console login so arcade knows who's playing
    consoleLogins.set(consoleId, {
      user: { id: user.id, name: user.name, email: user.email },
      loggedInAt: new Date().toISOString(),
    });

    // Try to send WebSocket message (optional - arcade may be polling instead)
    sendToConsole(consoleId, {
      type: 'readyToPlay',
      userId,
      userName: user.name,
    });

    console.log(`[${new Date().toISOString()}] Ready to play: ${user.email} on ${consoleId}`);

    res.json({
      success: true,
      message: 'Console is ready! Press PLAY on the machine.',
      creditsRemaining: updatedCredits.credits,
      availablePlays: updatedCredits.freePlayUsed ? updatedCredits.credits : updatedCredits.credits + 1,
    });
  } catch (e) {
    console.error('[API] Error starting game:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Start game as guest (no account needed for first free play)
app.post('/api/consoles/:consoleId/start-guest', (req, res) => {
  const { consoleId } = req.params;

  // Check if console is connected
  if (!connectedConsoles.has(consoleId)) {
    return res.status(404).json({ error: 'Console not connected' });
  }

  // Generate guest session ID
  const guestSessionId = 'guest_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

  // Store pending game start
  pendingGameStarts.set(consoleId, {
    guestSessionId,
    isGuest: true,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  // Send message to console to show PLAY button
  const sent = sendToConsole(consoleId, {
    type: 'readyToPlay',
    guestSessionId,
    isGuest: true,
  });

  if (!sent) {
    return res.status(500).json({ error: 'Failed to communicate with console' });
  }

  console.log(`[${new Date().toISOString()}] Guest ready to play on ${consoleId} (${guestSessionId})`);

  res.json({
    success: true,
    guestSessionId,
    message: 'Console is ready! Press PLAY on the machine.',
  });
});

// Check console status (for phone to poll)
app.get('/api/consoles/:consoleId/status', async (req, res) => {
  const { consoleId } = req.params;

  const isConnected = connectedConsoles.has(consoleId);
  const pending = pendingGameStarts.get(consoleId);

  try {
    const status = await db.getConsoleStatus(consoleId);
    res.json({
      consoleId,
      connected: isConnected,
      pendingGame: pending ? { userId: pending.userId, userName: pending.userName } : null,
      status: status?.status || 'unknown',
    });
  } catch (e) {
    res.json({
      consoleId,
      connected: isConnected,
      pendingGame: pending ? { userId: pending.userId, userName: pending.userName } : null,
      status: 'unknown',
    });
  }
});

// Login user to a console (called from phone after scanning QR + logging in)
app.post('/api/consoles/:consoleId/login', async (req, res) => {
  const { consoleId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const userRow = await db.findUserById(userId);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = db.formatUser(userRow);

    consoleLogins.set(consoleId, {
      user: { id: user.id, name: user.name, email: user.email },
      loggedInAt: new Date().toISOString(),
    });

    // Notify console via WebSocket
    const wsDelivered = sendToConsole(consoleId, {
      type: 'userLoggedIn',
      user: { id: user.id, name: user.name, email: user.email },
    });

    console.log(`[${new Date().toISOString()}] User ${user.name} logged into console ${consoleId} (ws: ${wsDelivered})`);
    res.json({ success: true, wsDelivered });
  } catch (e) {
    console.error('[API] Error logging in to console:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get logged-in user for a console (arcade polls this)
app.get('/api/consoles/:consoleId/logged-in-user', (req, res) => {
  const login = getConsoleLogin(req.params.consoleId);
  res.json({ user: login?.user || null });
});

// Reset console session (arcade calls this on page load to clear stale logins)
app.post('/api/consoles/:consoleId/reset', (req, res) => {
  const { consoleId } = req.params;
  consoleLogins.delete(consoleId);
  pendingGameStarts.delete(consoleId);
  console.log(`[Console] Reset: ${consoleId} — cleared stale login + pending game`);
  res.json({ success: true });
});

// Clear logged-in user from console (called when returning to menu)
app.delete('/api/consoles/:consoleId/logged-in-user', authMiddleware, (req, res) => {
  consoleLogins.delete(req.params.consoleId);
  pendingGameStarts.delete(req.params.consoleId);
  sendToConsole(req.params.consoleId, { type: 'userLoggedOut' });
  res.json({ success: true });
});

// Check if a game start is pending for this console (arcade polls this)
app.get('/api/consoles/:consoleId/pending-game', (req, res) => {
  const pending = pendingGameStarts.get(req.params.consoleId);
  if (pending && pending.expiresAt > Date.now()) {
    res.json({ pending: true, userId: pending.userId, userName: pending.userName });
  } else {
    if (pending) pendingGameStarts.delete(req.params.consoleId);
    res.json({ pending: false });
  }
});

// Clear pending game after arcade starts it
app.delete('/api/consoles/:consoleId/pending-game', (req, res) => {
  pendingGameStarts.delete(req.params.consoleId);
  res.json({ success: true });
});

// ============================================
// DATA RETRIEVAL ENDPOINTS
// ============================================

// Get all console statuses with game stats
app.get('/api/consoles', async (req, res) => {
  try {
    const now = Date.now();
    const statuses = await db.getAllConsoleStatuses();
    const allGameStats = await db.getAllGameStats();
    const consoles = [];

    statuses.forEach(status => {
      const timeSinceLastSeen = now - (status.lastSeen || 0);
      const isOffline = timeSinceLastSeen > 120000;
      const stats = allGameStats[status.consoleId] || {};

      consoles.push({
        ...status,
        ...stats,
        status: isOffline ? 'offline' : status.status,
        lastSeenText: formatLastSeen(timeSinceLastSeen),
        sessionDuration: stats.isPlaying && stats.currentSessionStart
          ? formatDuration(now - stats.currentSessionStart)
          : null,
      });
    });

    consoles.sort((a, b) => a.consoleId.localeCompare(b.consoleId));
    res.json(consoles);
  } catch (e) {
    console.error('[API] Error getting consoles:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get single console details
app.get('/api/consoles/:id', async (req, res) => {
  try {
    const status = await db.getConsoleStatus(req.params.id);
    const stats = await db.getGameStats(req.params.id);

    if (!status) {
      return res.status(404).json({ error: 'Console not found' });
    }

    const timeSinceLastSeen = Date.now() - (status.lastSeen || 0);

    res.json({
      ...status,
      ...stats,
      lastSeenText: formatLastSeen(timeSinceLastSeen),
      sessionDuration: stats?.isPlaying && stats?.currentSessionStart
        ? formatDuration(Date.now() - stats.currentSessionStart)
        : null,
    });
  } catch (e) {
    console.error('[API] Error getting console:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get fleet summary stats
app.get('/api/stats', async (req, res) => {
  try {
    const now = Date.now();
    const statuses = await db.getAllConsoleStatuses();
    const allGameStats = await db.getAllGameStats();
    let online = 0, offline = 0, warning = 0, playing = 0;
    let totalGamesPlayed = 0;

    statuses.forEach(status => {
      const timeSinceLastSeen = now - (status.lastSeen || 0);
      const isOffline = timeSinceLastSeen > 120000;
      const stats = allGameStats[status.consoleId];

      if (isOffline) {
        offline++;
      } else if (status.status === 'warning') {
        warning++;
      } else {
        online++;
      }

      if (stats?.isPlaying) {
        playing++;
      }

      totalGamesPlayed += stats?.gamesPlayed || 0;
    });

    // Get top score from leaderboard
    const leaderboard = await db.getLeaderboard(1);
    const topScore = leaderboard[0] || null;

    res.json({
      online,
      offline,
      warning,
      playing,
      total: statuses.length,
      totalGamesPlayed,
      topScore,
    });
  } catch (e) {
    console.error('[API] Error getting stats:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get console lifetime total bags (sum of all scores ever played on this console)
app.get('/api/consoles/:consoleId/total-bags', async (req, res) => {
  try {
    const totalBags = await db.getConsoleTotalBags(req.params.consoleId);
    res.json({ consoleId: req.params.consoleId, totalBags });
  } catch (e) {
    console.error('[API] Error getting console total bags:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get global leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await db.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (e) {
    console.error('[API] Error getting leaderboard:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get game stats for a specific console
app.get('/api/game/:consoleId', async (req, res) => {
  try {
    const stats = await db.getGameStats(req.params.consoleId);

    if (!stats) {
      return res.status(404).json({ error: 'Console not found' });
    }

    res.json(stats);
  } catch (e) {
    console.error('[API] Error getting game stats:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

function formatLastSeen(ms) {
  if (ms < 60000) return 'Just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)} min ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)} hours ago`;
  return `${Math.floor(ms / 86400000)} days ago`;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Impact Arcade API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      consoles: '/api/consoles',
      leaderboard: '/api/leaderboard',
      users: '/api/users',
      sessions: '/api/sessions',
    },
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'degraded', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

const requireAdmin = [authMiddleware, adminMiddleware(db)];

// Verify admin access (used by frontend middleware)
app.get('/api/admin/verify', requireAdmin, (req, res) => {
  res.json({ success: true });
});

// Switch active payment provider (admin only)
app.post('/api/admin/payments/provider', requireAdmin, (req, res) => {
  const { provider } = req.body;

  if (!provider || !['stripe', 'bolt'].includes(provider)) {
    return res.status(400).json({ error: 'provider must be "stripe" or "bolt"' });
  }

  activePaymentProvider = provider;
  console.log(`[Admin] Active payment provider switched to: ${provider}`);
  res.json({ success: true, activeProvider: activePaymentProvider });
});

// Cleanup test data
app.delete('/api/admin/cleanup-test-data', requireAdmin, async (req, res) => {
  try {
    const deleted = await db.cleanupTestData();

    // Clear in-memory maps for __test__ prefixed console IDs
    for (const key of connectedConsoles.keys()) {
      if (key.startsWith('__test__')) connectedConsoles.delete(key);
    }
    for (const key of consoleLogins.keys()) {
      if (key.startsWith('__test__')) consoleLogins.delete(key);
    }
    for (const key of pendingGameStarts.keys()) {
      if (key.startsWith('__test__')) pendingGameStarts.delete(key);
    }

    console.log(`[Admin] Test data cleaned up:`, deleted);
    res.json({ success: true, deleted });
  } catch (e) {
    console.error('[Admin] Cleanup error:', e);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// ============================================
// STARTUP
// ============================================

async function start() {
  try {
    // Initialize database schema
    await db.initializeDatabase();
    console.log('[DB] Database ready');
  } catch (e) {
    console.error('[DB] Failed to initialize database:', e.message);
    console.log('[DB] Server will start anyway — database features will fail until DB is available');
  }

  server.listen(PORT, () => {
    console.log(`Impactman API v2.0 running on port ${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Consoles: http://localhost:${PORT}/api/consoles`);
    console.log(`Leaderboard: http://localhost:${PORT}/api/leaderboard`);
  });
}

start();
