const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

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

// ============================================
// HELPERS
// ============================================

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Impactman API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Consoles: http://localhost:${PORT}/api/consoles`);
  console.log(`Leaderboard: http://localhost:${PORT}/api/leaderboard`);
});
