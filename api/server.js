require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { sendWelcomeEmail, sendScoreClaimedEmail } = require('./email');
const { createPayment, getSquareConfig, PLAY_PRICE_CENTS } = require('./payments');

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for both Express and WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Track connected consoles (consoleId -> WebSocket)
const connectedConsoles = new Map();

app.use(cors());
app.use(express.json());

// Serve static files from website/client/public
app.use(express.static(path.join(__dirname, '..', 'website', 'client', 'public'), {
  extensions: ['html']
}));

// ============================================
// DATA STORES
// ============================================

// Console system status (from Pi monitoring agent)
const consoleStatuses = new Map();

// Game statistics per console
const gameStats = new Map();

// Global leaderboard (top scores across all consoles)
const globalLeaderboard = [];

// Game sessions (for QR code flow)
const gameSessions = new Map();

// Users
const users = new Map();

// User scores (userId -> array of scores)
const userScores = new Map();

// User play credits (userId -> { freePlayUsed, credits, payments[] })
const userCredits = new Map();

// Console login sessions (consoleId -> { user, loggedInAt })
const consoleLogins = new Map();

// Pending game starts (consoleId -> { userId, expiresAt })
const pendingGameStarts = new Map();

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
          // Auto-save score for logged-in player
          const user = users.get(userId);
          if (user) {
            const scoreEntry = {
              consoleId,
              score: score || 0,
              level: level || 1,
              bags: bags || 0,
              plasticRemoved: (bags || 0) * 0.1,
              playedAt: new Date().toISOString(),
            };

            const scores = userScores.get(userId) || [];
            scores.push(scoreEntry);
            userScores.set(userId, scores);

            // Update user totals
            user.totalScore += score || 0;
            user.totalBags += bags || 0;
            user.gamesPlayed += 1;
            users.set(userId, user);

            console.log(`[WS] Score saved for ${user.email}: ${score} pts`);

            // Send score saved confirmation to console
            ws.send(JSON.stringify({
              type: 'scoreSaved',
              userId,
              score,
              userName: user.name,
            }));
          }
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

function generateToken() {
  return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
}

// ============================================
// TEST DATA INITIALIZATION
// ============================================

const testConsoles = [
  { consoleId: 'IMP-001', name: '001' },
  { consoleId: 'IMP-002', name: '002' },
  { consoleId: 'IMP-003', name: '003' },
  { consoleId: 'IMP-004', name: '004' },
  { consoleId: 'IMP-005', name: '005' },
  { consoleId: 'IMP-006', name: '006' },
  { consoleId: 'IMP-007', name: '007' },
  { consoleId: 'IMP-008', name: '008' },
  { consoleId: 'IMP-009', name: '009' },
  { consoleId: 'IMP-010', name: '010' },
];

// Initialize test data
testConsoles.forEach((console, index) => {
  const isOffline = index === 4;
  const isWarning = index === 6;
  const isPlaying = index === 1 || index === 5 || index === 8;

  // System status
  consoleStatuses.set(console.consoleId, {
    consoleId: console.consoleId,
    name: console.name,
    temperature: isOffline ? 0 : 38 + Math.floor(Math.random() * 15),
    cpuUsage: isOffline ? 0 : (isPlaying ? 35 + Math.floor(Math.random() * 20) : 8 + Math.floor(Math.random() * 15)),
    memoryUsage: isOffline ? 0 : 25 + Math.floor(Math.random() * 20),
    diskUsage: isOffline ? 0 : 15 + Math.floor(Math.random() * 10),
    uptime: isOffline ? '-' : `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h`,
    version: isOffline ? '1.2.1' : '1.2.3',
    status: isOffline ? 'offline' : (isWarning ? 'warning' : 'online'),
    lastSeen: isOffline ? Date.now() - 7200000 : Date.now() - Math.floor(Math.random() * 60000),
    gameRunning: !isOffline,
    ip: `192.168.1.${100 + index}`,
    hostname: `impactarcade-${console.consoleId.toLowerCase()}`,
  });

  // Game statistics
  const gamesPlayed = Math.floor(Math.random() * 3000) + 100;
  const highScore = Math.floor(Math.random() * 50000) + 5000;

  gameStats.set(console.consoleId, {
    consoleId: console.consoleId,
    gamesPlayed: gamesPlayed,
    highScore: highScore,
    highScoreDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalScore: gamesPlayed * Math.floor(Math.random() * 2000 + 500),
    avgScore: Math.floor(Math.random() * 3000 + 1000),
    // Current gameplay state
    isPlaying: isPlaying,
    currentLevel: isPlaying ? Math.floor(Math.random() * 8) + 1 : 0,
    currentScore: isPlaying ? Math.floor(Math.random() * 15000) : 0,
    currentSessionStart: isPlaying ? Date.now() - Math.floor(Math.random() * 300000) : null,
  });

  // Add high scores to global leaderboard
  globalLeaderboard.push({
    consoleId: console.consoleId,
    consoleName: console.name,
    score: highScore,
    date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
});

// Sort global leaderboard
globalLeaderboard.sort((a, b) => b.score - a.score);

// ============================================
// CONSOLE STATUS ENDPOINTS (from Pi)
// ============================================

// Receive status updates from Pi consoles
app.post('/api/status', (req, res) => {
  const status = req.body;

  if (!status.consoleId) {
    return res.status(400).json({ error: 'consoleId required' });
  }

  let statusLevel = 'online';
  if (status.temperature >= 70 || status.cpuUsage >= 90 || status.memoryUsage >= 90) {
    statusLevel = 'warning';
  }

  consoleStatuses.set(status.consoleId, {
    ...consoleStatuses.get(status.consoleId),
    ...status,
    status: statusLevel,
    lastSeen: Date.now(),
  });

  console.log(`[${new Date().toISOString()}] Status: ${status.consoleId} - CPU ${status.cpuUsage}%, Temp ${status.temperature}°C`);
  res.json({ success: true });
});

// ============================================
// GAME EVENTS ENDPOINTS (from web game)
// ============================================

// Game started
app.post('/api/game/start', (req, res) => {
  const { consoleId } = req.body;

  if (!consoleId) {
    return res.status(400).json({ error: 'consoleId required' });
  }

  const stats = gameStats.get(consoleId) || {
    consoleId,
    gamesPlayed: 0,
    highScore: 0,
    highScoreDate: null,
    totalScore: 0,
    avgScore: 0,
  };

  stats.gamesPlayed += 1;
  stats.isPlaying = true;
  stats.currentLevel = 1;
  stats.currentScore = 0;
  stats.currentSessionStart = Date.now();

  gameStats.set(consoleId, stats);

  console.log(`[${new Date().toISOString()}] Game START: ${consoleId} (Total games: ${stats.gamesPlayed})`);
  res.json({ success: true, gameNumber: stats.gamesPlayed });
});

// Game progress update (level/score change)
app.post('/api/game/update', (req, res) => {
  const { consoleId, level, score } = req.body;

  if (!consoleId) {
    return res.status(400).json({ error: 'consoleId required' });
  }

  const stats = gameStats.get(consoleId);
  if (!stats) {
    return res.status(404).json({ error: 'Console not found' });
  }

  stats.isPlaying = true;
  stats.currentLevel = level || stats.currentLevel;
  stats.currentScore = score || stats.currentScore;

  gameStats.set(consoleId, stats);
  res.json({ success: true });
});

// Game ended
app.post('/api/game/end', (req, res) => {
  const { consoleId, finalScore, level } = req.body;

  if (!consoleId) {
    return res.status(400).json({ error: 'consoleId required' });
  }

  const stats = gameStats.get(consoleId);
  if (!stats) {
    return res.status(404).json({ error: 'Console not found' });
  }

  // Update stats
  stats.isPlaying = false;
  stats.currentLevel = 0;
  stats.currentScore = 0;
  stats.currentSessionStart = null;
  stats.totalScore += finalScore || 0;
  stats.avgScore = Math.floor(stats.totalScore / stats.gamesPlayed);

  // Check for new high score
  let isNewHighScore = false;
  if (finalScore > stats.highScore) {
    stats.highScore = finalScore;
    stats.highScoreDate = new Date().toISOString();
    isNewHighScore = true;

    // Update global leaderboard
    const leaderboardEntry = globalLeaderboard.find(e => e.consoleId === consoleId);
    if (leaderboardEntry) {
      leaderboardEntry.score = finalScore;
      leaderboardEntry.date = stats.highScoreDate;
    } else {
      const consoleName = consoleStatuses.get(consoleId)?.name || consoleId;
      globalLeaderboard.push({
        consoleId,
        consoleName,
        score: finalScore,
        date: stats.highScoreDate,
      });
    }
    globalLeaderboard.sort((a, b) => b.score - a.score);
  }

  gameStats.set(consoleId, stats);

  console.log(`[${new Date().toISOString()}] Game END: ${consoleId} - Score: ${finalScore}, Level: ${level}${isNewHighScore ? ' NEW HIGH SCORE!' : ''}`);
  res.json({ success: true, isNewHighScore, highScore: stats.highScore });
});

// ============================================
// SESSION ENDPOINTS (QR Code Flow)
// ============================================

// Create a new game session (called at game over)
app.post('/api/sessions', (req, res) => {
  const { consoleId, raspiId, score, level, bags, plasticRemoved } = req.body;

  if (!consoleId) {
    return res.status(400).json({ error: 'consoleId required' });
  }

  // Generate unique session code
  let code;
  do {
    code = generateSessionCode();
  } while (gameSessions.has(code));

  const session = {
    code,
    consoleId,
    raspiId: raspiId || null,
    eventId: req.body.eventId || null, // Event identifier (set via Fleet Manager)
    eventDate: req.body.eventDate || null, // Event date
    score: score || 0,
    level: level || 1,
    bags: bags || 0,
    plasticRemoved: plasticRemoved || 0,
    claimed: false,
    userId: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };

  gameSessions.set(code, session);

  console.log(`[${new Date().toISOString()}] Session created: ${code} | Console: ${consoleId} | Raspi: ${raspiId || 'N/A'} | Score: ${score}`);

  res.json({
    success: true,
    code,
    claimUrl: `/claim/${code}`,
    session,
  });
});

// Get session info
app.get('/api/sessions/:code', (req, res) => {
  const session = gameSessions.get(req.params.code.toUpperCase());

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Check if expired
  if (new Date(session.expiresAt) < new Date()) {
    return res.status(410).json({ error: 'Session expired' });
  }

  res.json(session);
});

// Claim a session (link to user account)
app.post('/api/sessions/:code/claim', (req, res) => {
  const { email, name } = req.body;
  const code = req.params.code.toUpperCase();

  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }

  const session = gameSessions.get(code);
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
  let user = Array.from(users.values()).find(u => u.email === email.toLowerCase());

  if (!user) {
    const userId = generateUserId();
    user = {
      id: userId,
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString(),
      totalScore: 0,
      totalBags: 0,
      gamesPlayed: 0,
    };
    users.set(userId, user);
    userScores.set(userId, []);
    console.log(`[${new Date().toISOString()}] New user: ${user.email} (${userId})`);
  }

  // Claim the session
  session.claimed = true;
  session.userId = user.id;
  session.claimedAt = new Date().toISOString();

  // Add score to user's history
  const scoreEntry = {
    sessionCode: code,
    consoleId: session.consoleId,
    eventId: session.eventId, // For tracking per-event scores
    eventDate: session.eventDate,
    score: session.score,
    level: session.level,
    bags: session.bags,
    plasticRemoved: session.plasticRemoved,
    playedAt: session.createdAt,
    claimedAt: session.claimedAt,
  };

  const scores = userScores.get(user.id) || [];
  scores.push(scoreEntry);
  userScores.set(user.id, scores);

  // Update user totals
  user.totalScore += session.score;
  user.totalBags += session.bags;
  user.gamesPlayed += 1;
  users.set(user.id, user);

  // Generate auth token
  const token = generateToken();

  // Send score claimed email
  sendScoreClaimedEmail(user, session).catch(err => {
    console.error('[API] Failed to send score claimed email:', err);
  });

  console.log(`[${new Date().toISOString()}] Session claimed: ${code} by ${user.email}`);

  res.json({
    success: true,
    user,
    token,
    session,
  });
});

// ============================================
// USER ENDPOINTS
// ============================================

// Login/signup with email
app.post('/api/users/login', (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }

  // Find or create user
  let user = Array.from(users.values()).find(u => u.email === email.toLowerCase());
  let isNewUser = false;

  if (!user) {
    const userId = generateUserId();
    user = {
      id: userId,
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString(),
      totalScore: 0,
      totalBags: 0,
      gamesPlayed: 0,
    };
    users.set(userId, user);
    userScores.set(userId, []);
    isNewUser = true;
    console.log(`[${new Date().toISOString()}] New user signup: ${user.email}`);
  }

  const token = generateToken();

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
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const user = users.get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const scores = userScores.get(user.id) || [];
  const highScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;

  res.json({
    ...user,
    highScore,
    scores: scores.slice(-10).reverse(), // Last 10 games
  });
});

// Get user's score history
app.get('/api/users/:id/scores', (req, res) => {
  const user = users.get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const scores = userScores.get(user.id) || [];

  res.json({
    user,
    scores: scores.reverse(),
    stats: {
      totalGames: scores.length,
      totalScore: user.totalScore,
      totalBags: user.totalBags,
      highScore: scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0,
      avgScore: scores.length > 0 ? Math.floor(user.totalScore / scores.length) : 0,
    },
  });
});

// Save score directly for logged-in users (no session/claim needed)
app.post('/api/users/:id/scores', (req, res) => {
  const user = users.get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { consoleId, raspiId, score, level, bags, plasticRemoved } = req.body;

  const scoreEntry = {
    sessionCode: null,
    consoleId: consoleId || 'IMP-001',
    eventId: req.body.eventId || null,
    eventDate: req.body.eventDate || null,
    score: score || 0,
    level: level || 1,
    bags: bags || 0,
    plasticRemoved: plasticRemoved || 0,
    playedAt: new Date().toISOString(),
    claimedAt: new Date().toISOString(),
  };

  const scores = userScores.get(user.id) || [];
  scores.push(scoreEntry);
  userScores.set(user.id, scores);

  // Update user totals
  user.totalScore += scoreEntry.score;
  user.totalBags += scoreEntry.bags;
  user.gamesPlayed += 1;
  users.set(user.id, user);

  // Update global leaderboard if this is a new high score for the user
  const userHighScore = Math.max(...scores.map(s => s.score));
  const existingEntry = globalLeaderboard.find(e => e.consoleId === (consoleId || 'IMP-001'));
  if (existingEntry && scoreEntry.score > existingEntry.score) {
    existingEntry.score = scoreEntry.score;
    existingEntry.date = scoreEntry.playedAt;
    globalLeaderboard.sort((a, b) => b.score - a.score);
  } else if (!existingEntry && scoreEntry.score > 0) {
    globalLeaderboard.push({
      consoleId: consoleId || 'IMP-001',
      consoleName: consoleId || 'IMP-001',
      score: scoreEntry.score,
      date: scoreEntry.playedAt,
    });
    globalLeaderboard.sort((a, b) => b.score - a.score);
  }

  console.log(`[${new Date().toISOString()}] Score saved for ${user.email}: ${scoreEntry.score} (Level ${scoreEntry.level})`);

  res.json({
    success: true,
    user,
    scoreEntry,
  });
});

// ============================================
// PAYMENT ENDPOINTS (Apple Pay via Square)
// ============================================

// Get Square configuration for frontend
app.get('/api/payments/config', (req, res) => {
  const config = getSquareConfig();
  res.json({
    ...config,
    pricePerPlay: PLAY_PRICE_CENTS / 100,
    currency: 'USD',
  });
});

// Get user's play credits
app.get('/api/users/:id/credits', (req, res) => {
  const user = users.get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const credits = userCredits.get(user.id) || {
    freePlayUsed: false,
    credits: 0,
    payments: [],
  };

  // If they haven't used their free play, they have 1 available
  const availablePlays = credits.freePlayUsed ? credits.credits : credits.credits + 1;

  res.json({
    userId: user.id,
    freePlayUsed: credits.freePlayUsed,
    paidCredits: credits.credits,
    availablePlays,
    payments: credits.payments.slice(-10).reverse(),
  });
});

// Process Apple Pay payment
app.post('/api/payments/apple-pay', async (req, res) => {
  const { userId, sourceId } = req.body;

  if (!userId || !sourceId) {
    return res.status(400).json({ error: 'userId and sourceId required' });
  }

  const user = users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const result = await createPayment(sourceId, userId, user.email);

  if (!result.success) {
    return res.status(400).json({ error: result.error || 'Payment failed' });
  }

  // Add credit to user
  const credits = userCredits.get(userId) || {
    freePlayUsed: false,
    credits: 0,
    payments: [],
  };

  credits.credits += 1;
  credits.payments.push({
    paymentId: result.paymentId,
    amount: PLAY_PRICE_CENTS / 100,
    receiptUrl: result.receiptUrl,
    createdAt: new Date().toISOString(),
  });

  userCredits.set(userId, credits);

  console.log(`[${new Date().toISOString()}] Payment processed: ${user.email} now has ${credits.credits} credits`);

  res.json({
    success: true,
    paymentId: result.paymentId,
    receiptUrl: result.receiptUrl,
    credits: credits.credits,
    availablePlays: credits.freePlayUsed ? credits.credits : credits.credits + 1,
  });
});

// Use a play credit (called when starting a game)
app.post('/api/users/:id/use-credit', (req, res) => {
  const user = users.get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const credits = userCredits.get(user.id) || {
    freePlayUsed: false,
    credits: 0,
    payments: [],
  };

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
    credits.freePlayUsed = true;
    console.log(`[${new Date().toISOString()}] Free play used: ${user.email}`);
  } else {
    credits.credits -= 1;
    console.log(`[${new Date().toISOString()}] Paid credit used: ${user.email} (${credits.credits} remaining)`);
  }

  userCredits.set(user.id, credits);

  res.json({
    success: true,
    creditsRemaining: credits.credits,
    freePlayUsed: credits.freePlayUsed,
    availablePlays: credits.freePlayUsed ? credits.credits : credits.credits + 1,
  });
});

// ============================================
// CONSOLE GAME CONTROL (Phone → Console)
// ============================================

// Start game on a console (called from phone after scanning QR)
app.post('/api/consoles/:consoleId/start-game', (req, res) => {
  const { consoleId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const user = users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if console is connected
  if (!connectedConsoles.has(consoleId)) {
    return res.status(404).json({ error: 'Console not connected' });
  }

  // Check credits
  const credits = userCredits.get(userId) || {
    freePlayUsed: false,
    credits: 0,
    payments: [],
  };

  const availablePlays = credits.freePlayUsed ? credits.credits : credits.credits + 1;

  if (availablePlays <= 0) {
    return res.status(402).json({
      error: 'No play credits available',
      needsPayment: true,
    });
  }

  // Use a credit
  if (!credits.freePlayUsed) {
    credits.freePlayUsed = true;
    console.log(`[${new Date().toISOString()}] Free play used: ${user.email} on ${consoleId}`);
  } else {
    credits.credits -= 1;
    console.log(`[${new Date().toISOString()}] Paid credit used: ${user.email} on ${consoleId} (${credits.credits} remaining)`);
  }
  userCredits.set(userId, credits);

  // Store pending game start
  pendingGameStarts.set(consoleId, {
    userId,
    userName: user.name,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  // Send message to console to show PLAY button
  const sent = sendToConsole(consoleId, {
    type: 'readyToPlay',
    userId,
    userName: user.name,
  });

  if (!sent) {
    return res.status(500).json({ error: 'Failed to communicate with console' });
  }

  console.log(`[${new Date().toISOString()}] Ready to play: ${user.email} on ${consoleId}`);

  res.json({
    success: true,
    message: 'Console is ready! Press PLAY on the machine.',
    creditsRemaining: credits.credits,
    availablePlays: credits.freePlayUsed ? credits.credits : credits.credits + 1,
  });
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
app.get('/api/consoles/:consoleId/status', (req, res) => {
  const { consoleId } = req.params;

  const isConnected = connectedConsoles.has(consoleId);
  const pending = pendingGameStarts.get(consoleId);
  const status = consoleStatuses.get(consoleId);

  res.json({
    consoleId,
    connected: isConnected,
    pendingGame: pending ? { userId: pending.userId, userName: pending.userName } : null,
    status: status?.status || 'unknown',
  });
});

// Login user to a console (called from phone after scanning QR + logging in)
app.post('/api/consoles/:consoleId/login', (req, res) => {
  const { consoleId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const user = users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  consoleLogins.set(consoleId, {
    user: { id: user.id, name: user.name, email: user.email },
    loggedInAt: new Date().toISOString(),
  });

  console.log(`[${new Date().toISOString()}] User ${user.name} logged into console ${consoleId}`);
  res.json({ success: true });
});

// Get logged-in user for a console (arcade polls this)
app.get('/api/consoles/:consoleId/logged-in-user', (req, res) => {
  const login = consoleLogins.get(req.params.consoleId);
  res.json({ user: login?.user || null });
});

// Clear logged-in user from console (called when returning to menu)
app.delete('/api/consoles/:consoleId/logged-in-user', (req, res) => {
  consoleLogins.delete(req.params.consoleId);
  res.json({ success: true });
});

// ============================================
// DATA RETRIEVAL ENDPOINTS
// ============================================

// Get all console statuses with game stats
app.get('/api/consoles', (req, res) => {
  const now = Date.now();
  const consoles = [];

  consoleStatuses.forEach((status, id) => {
    const timeSinceLastSeen = now - status.lastSeen;
    const isOffline = timeSinceLastSeen > 120000;
    const stats = gameStats.get(id) || {};

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
});

// Get single console details
app.get('/api/consoles/:id', (req, res) => {
  const status = consoleStatuses.get(req.params.id);
  const stats = gameStats.get(req.params.id);

  if (!status) {
    return res.status(404).json({ error: 'Console not found' });
  }

  const timeSinceLastSeen = Date.now() - status.lastSeen;

  res.json({
    ...status,
    ...stats,
    lastSeenText: formatLastSeen(timeSinceLastSeen),
    sessionDuration: stats?.isPlaying && stats?.currentSessionStart
      ? formatDuration(Date.now() - stats.currentSessionStart)
      : null,
  });
});

// Get fleet summary stats
app.get('/api/stats', (req, res) => {
  const now = Date.now();
  let online = 0, offline = 0, warning = 0, playing = 0;
  let totalGamesPlayed = 0;

  consoleStatuses.forEach((status, id) => {
    const timeSinceLastSeen = now - status.lastSeen;
    const isOffline = timeSinceLastSeen > 120000;
    const stats = gameStats.get(id);

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

  // Get top score
  const topScore = globalLeaderboard[0] || null;

  res.json({
    online,
    offline,
    warning,
    playing,
    total: consoleStatuses.size,
    totalGamesPlayed,
    topScore,
  });
});

// Get global leaderboard
app.get('/api/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json(globalLeaderboard.slice(0, limit));
});

// Get game stats for a specific console
app.get('/api/game/:consoleId', (req, res) => {
  const stats = gameStats.get(req.params.consoleId);

  if (!stats) {
    return res.status(404).json({ error: 'Console not found' });
  }

  res.json(stats);
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
    version: '1.0.0',
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
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`Impactman API running on port ${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Consoles: http://localhost:${PORT}/api/consoles`);
  console.log(`Leaderboard: http://localhost:${PORT}/api/leaderboard`);
});

