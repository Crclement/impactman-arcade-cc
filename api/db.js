const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.app')
    ? { rejectUnauthorized: false }
    : false,
});

// ============================================
// SCHEMA INITIALIZATION
// ============================================

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        total_score INTEGER DEFAULT 0,
        total_bags INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        console_id TEXT,
        session_code TEXT,
        event_id TEXT,
        event_date TEXT,
        score INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        bags INTEGER DEFAULT 0,
        plastic_removed REAL DEFAULT 0,
        idempotency_key TEXT UNIQUE,
        played_at TIMESTAMPTZ DEFAULT NOW(),
        claimed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS sessions (
        code TEXT PRIMARY KEY,
        console_id TEXT NOT NULL,
        raspi_id TEXT,
        event_id TEXT,
        event_date TEXT,
        score INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        bags INTEGER DEFAULT 0,
        plastic_removed REAL DEFAULT 0,
        claimed BOOLEAN DEFAULT FALSE,
        user_id TEXT REFERENCES users(id),
        claimed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS credits (
        user_id TEXT PRIMARY KEY REFERENCES users(id),
        free_play_used BOOLEAN DEFAULT FALSE,
        credits INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        payment_id TEXT,
        amount REAL,
        receipt_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS console_statuses (
        console_id TEXT PRIMARY KEY,
        name TEXT,
        temperature REAL DEFAULT 0,
        cpu_usage REAL DEFAULT 0,
        memory_usage REAL DEFAULT 0,
        disk_usage REAL DEFAULT 0,
        uptime TEXT,
        version TEXT,
        status TEXT DEFAULT 'online',
        last_seen BIGINT,
        game_running BOOLEAN DEFAULT FALSE,
        ip TEXT,
        hostname TEXT
      );

      CREATE TABLE IF NOT EXISTS game_stats (
        console_id TEXT PRIMARY KEY,
        games_played INTEGER DEFAULT 0,
        high_score INTEGER DEFAULT 0,
        high_score_date TIMESTAMPTZ,
        total_score BIGINT DEFAULT 0,
        avg_score INTEGER DEFAULT 0,
        is_playing BOOLEAN DEFAULT FALSE,
        current_level INTEGER DEFAULT 0,
        current_score INTEGER DEFAULT 0,
        current_session_start BIGINT
      );

      CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
      CREATE INDEX IF NOT EXISTS idx_scores_score_desc ON scores(score DESC);
      CREATE INDEX IF NOT EXISTS idx_scores_idempotency ON scores(idempotency_key) WHERE idempotency_key IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
    `);
    console.log('[DB] Schema initialized');
  } finally {
    client.release();
  }
}

// ============================================
// USERS
// ============================================

async function findUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function createUser(id, email, name) {
  const { rows } = await pool.query(
    `INSERT INTO users (id, email, name, total_score, total_bags, games_played, created_at)
     VALUES ($1, $2, $3, 0, 0, 0, NOW())
     RETURNING *`,
    [id, email.toLowerCase(), name]
  );
  return rows[0];
}

async function updateUserTotals(id, scoreInc, bagsInc) {
  const { rows } = await pool.query(
    `UPDATE users
     SET total_score = total_score + $2,
         total_bags = total_bags + $3,
         games_played = games_played + 1
     WHERE id = $1
     RETURNING *`,
    [id, scoreInc, bagsInc]
  );
  return rows[0];
}

// Convert DB row (snake_case) to API format (camelCase)
function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role || 'user',
    totalScore: row.total_score,
    totalBags: row.total_bags,
    gamesPlayed: row.games_played,
    createdAt: row.created_at,
  };
}

// ============================================
// SCORES
// ============================================

async function addScore(userId, { consoleId, sessionCode, eventId, eventDate, score, level, bags, plasticRemoved, playedAt, claimedAt, idempotencyKey }) {
  // Check idempotency
  if (idempotencyKey) {
    const { rows: existing } = await pool.query(
      'SELECT id FROM scores WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    if (existing.length > 0) {
      return { duplicate: true };
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO scores (user_id, console_id, session_code, event_id, event_date, score, level, bags, plastic_removed, idempotency_key, played_at, claimed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [userId, consoleId, sessionCode || null, eventId || null, eventDate || null, score || 0, level || 1, bags || 0, plasticRemoved || 0, idempotencyKey || null, playedAt || new Date(), claimedAt || null]
  );
  return rows[0];
}

async function getUserScores(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM scores WHERE user_id = $1 ORDER BY played_at DESC`,
    [userId]
  );
  return rows.map(formatScore);
}

function formatScore(row) {
  if (!row) return null;
  return {
    sessionCode: row.session_code,
    consoleId: row.console_id,
    eventId: row.event_id,
    eventDate: row.event_date,
    score: row.score,
    level: row.level,
    bags: row.bags,
    plasticRemoved: row.plastic_removed,
    playedAt: row.played_at,
    claimedAt: row.claimed_at,
  };
}

// ============================================
// SESSIONS
// ============================================

async function createSession(code, { consoleId, raspiId, eventId, eventDate, score, level, bags, plasticRemoved }) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const { rows } = await pool.query(
    `INSERT INTO sessions (code, console_id, raspi_id, event_id, event_date, score, level, bags, plastic_removed, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [code, consoleId, raspiId || null, eventId || null, eventDate || null, score || 0, level || 1, bags || 0, plasticRemoved || 0, expiresAt]
  );
  return formatSession(rows[0]);
}

async function getSession(code) {
  const { rows } = await pool.query(
    'SELECT * FROM sessions WHERE code = $1',
    [code.toUpperCase()]
  );
  return rows[0] ? formatSession(rows[0]) : null;
}

async function sessionCodeExists(code) {
  const { rows } = await pool.query(
    'SELECT 1 FROM sessions WHERE code = $1',
    [code]
  );
  return rows.length > 0;
}

async function claimSession(code, userId) {
  const { rows } = await pool.query(
    `UPDATE sessions
     SET claimed = TRUE, user_id = $2, claimed_at = NOW()
     WHERE code = $1
     RETURNING *`,
    [code, userId]
  );
  return rows[0] ? formatSession(rows[0]) : null;
}

function formatSession(row) {
  if (!row) return null;
  return {
    code: row.code,
    consoleId: row.console_id,
    raspiId: row.raspi_id,
    eventId: row.event_id,
    eventDate: row.event_date,
    score: row.score,
    level: row.level,
    bags: row.bags,
    plasticRemoved: row.plastic_removed,
    claimed: row.claimed,
    userId: row.user_id,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

// ============================================
// CREDITS
// ============================================

async function getCredits(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM credits WHERE user_id = $1',
    [userId]
  );
  if (rows[0]) {
    return { freePlayUsed: rows[0].free_play_used, credits: rows[0].credits };
  }
  return { freePlayUsed: false, credits: 0 };
}

async function ensureCredits(userId) {
  await pool.query(
    `INSERT INTO credits (user_id, free_play_used, credits)
     VALUES ($1, FALSE, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

async function useFreePlay(userId) {
  await ensureCredits(userId);
  await pool.query(
    'UPDATE credits SET free_play_used = TRUE WHERE user_id = $1',
    [userId]
  );
}

async function addCredit(userId) {
  await ensureCredits(userId);
  const { rows } = await pool.query(
    'UPDATE credits SET credits = credits + 1 WHERE user_id = $1 RETURNING credits',
    [userId]
  );
  return rows[0].credits;
}

async function usePaidCredit(userId) {
  await ensureCredits(userId);
  const { rows } = await pool.query(
    'UPDATE credits SET credits = credits - 1 WHERE user_id = $1 AND credits > 0 RETURNING credits',
    [userId]
  );
  return rows[0]?.credits ?? 0;
}

// ============================================
// PAYMENTS
// ============================================

async function addPayment(userId, paymentId, amount, receiptUrl) {
  await pool.query(
    `INSERT INTO payments (user_id, payment_id, amount, receipt_url)
     VALUES ($1, $2, $3, $4)`,
    [userId, paymentId, amount, receiptUrl]
  );
}

async function getUserPayments(userId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows.map(r => ({
    paymentId: r.payment_id,
    amount: r.amount,
    receiptUrl: r.receipt_url,
    createdAt: r.created_at,
  }));
}

// ============================================
// CONSOLE STATUSES
// ============================================

async function upsertConsoleStatus(data) {
  const { consoleId, name, temperature, cpuUsage, memoryUsage, diskUsage, uptime, version, status, gameRunning, ip, hostname } = data;
  await pool.query(
    `INSERT INTO console_statuses (console_id, name, temperature, cpu_usage, memory_usage, disk_usage, uptime, version, status, last_seen, game_running, ip, hostname)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (console_id) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, console_statuses.name),
       temperature = COALESCE(EXCLUDED.temperature, console_statuses.temperature),
       cpu_usage = COALESCE(EXCLUDED.cpu_usage, console_statuses.cpu_usage),
       memory_usage = COALESCE(EXCLUDED.memory_usage, console_statuses.memory_usage),
       disk_usage = COALESCE(EXCLUDED.disk_usage, console_statuses.disk_usage),
       uptime = COALESCE(EXCLUDED.uptime, console_statuses.uptime),
       version = COALESCE(EXCLUDED.version, console_statuses.version),
       status = EXCLUDED.status,
       last_seen = EXCLUDED.last_seen,
       game_running = COALESCE(EXCLUDED.game_running, console_statuses.game_running),
       ip = COALESCE(EXCLUDED.ip, console_statuses.ip),
       hostname = COALESCE(EXCLUDED.hostname, console_statuses.hostname)`,
    [consoleId, name || null, temperature || 0, cpuUsage || 0, memoryUsage || 0, diskUsage || 0, uptime || null, version || null, status, Date.now(), gameRunning ?? true, ip || null, hostname || null]
  );
}

async function getConsoleStatus(consoleId) {
  const { rows } = await pool.query(
    'SELECT * FROM console_statuses WHERE console_id = $1',
    [consoleId]
  );
  return rows[0] ? formatConsoleStatus(rows[0]) : null;
}

async function getAllConsoleStatuses() {
  const { rows } = await pool.query(
    'SELECT * FROM console_statuses ORDER BY console_id'
  );
  return rows.map(formatConsoleStatus);
}

function formatConsoleStatus(row) {
  if (!row) return null;
  return {
    consoleId: row.console_id,
    name: row.name,
    temperature: row.temperature,
    cpuUsage: row.cpu_usage,
    memoryUsage: row.memory_usage,
    diskUsage: row.disk_usage,
    uptime: row.uptime,
    version: row.version,
    status: row.status,
    lastSeen: row.last_seen ? Number(row.last_seen) : 0,
    gameRunning: row.game_running,
    ip: row.ip,
    hostname: row.hostname,
  };
}

// ============================================
// GAME STATS
// ============================================

async function upsertGameStats(consoleId, data) {
  const { gamesPlayed, highScore, highScoreDate, totalScore, avgScore, isPlaying, currentLevel, currentScore, currentSessionStart } = data;
  await pool.query(
    `INSERT INTO game_stats (console_id, games_played, high_score, high_score_date, total_score, avg_score, is_playing, current_level, current_score, current_session_start)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (console_id) DO UPDATE SET
       games_played = EXCLUDED.games_played,
       high_score = EXCLUDED.high_score,
       high_score_date = EXCLUDED.high_score_date,
       total_score = EXCLUDED.total_score,
       avg_score = EXCLUDED.avg_score,
       is_playing = EXCLUDED.is_playing,
       current_level = EXCLUDED.current_level,
       current_score = EXCLUDED.current_score,
       current_session_start = EXCLUDED.current_session_start`,
    [consoleId, gamesPlayed || 0, highScore || 0, highScoreDate || null, totalScore || 0, avgScore || 0, isPlaying || false, currentLevel || 0, currentScore || 0, currentSessionStart || null]
  );
}

async function getGameStats(consoleId) {
  const { rows } = await pool.query(
    'SELECT * FROM game_stats WHERE console_id = $1',
    [consoleId]
  );
  return rows[0] ? formatGameStats(rows[0]) : null;
}

async function getAllGameStats() {
  const { rows } = await pool.query(
    'SELECT * FROM game_stats ORDER BY console_id'
  );
  const map = {};
  rows.forEach(r => { map[r.console_id] = formatGameStats(r); });
  return map;
}

function formatGameStats(row) {
  if (!row) return null;
  return {
    consoleId: row.console_id,
    gamesPlayed: row.games_played,
    highScore: row.high_score,
    highScoreDate: row.high_score_date,
    totalScore: Number(row.total_score),
    avgScore: row.avg_score,
    isPlaying: row.is_playing,
    currentLevel: row.current_level,
    currentScore: row.current_score,
    currentSessionStart: row.current_session_start ? Number(row.current_session_start) : null,
  };
}

// ============================================
// LEADERBOARD (query-based)
// ============================================

async function getLeaderboard(limit = 10) {
  const { rows } = await pool.query(
    `SELECT u.name, u.id as user_id, s.score, s.console_id, s.played_at
     FROM scores s
     JOIN users u ON s.user_id = u.id
     ORDER BY s.score DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map(r => ({
    userName: r.name,
    userId: r.user_id,
    consoleId: r.console_id,
    consoleName: r.console_id,
    score: r.score,
    date: r.played_at,
  }));
}

// ============================================
// CLEANUP TEST DATA
// ============================================

async function cleanupTestData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find test user IDs
    const { rows: testUsers } = await client.query(
      "SELECT id FROM users WHERE email LIKE '__test__%'"
    );
    const userIds = testUsers.map(r => r.id);

    const deleted = { users: 0, scores: 0, sessions: 0, credits: 0, payments: 0, consoleStatuses: 0, gameStats: 0 };

    if (userIds.length > 0) {
      // Delete in FK order: payments -> credits -> scores -> sessions (by user) -> users
      const { rowCount: paymentsCount } = await client.query(
        'DELETE FROM payments WHERE user_id = ANY($1)',
        [userIds]
      );
      deleted.payments = paymentsCount;

      const { rowCount: creditsCount } = await client.query(
        'DELETE FROM credits WHERE user_id = ANY($1)',
        [userIds]
      );
      deleted.credits = creditsCount;

      const { rowCount: scoresCount } = await client.query(
        'DELETE FROM scores WHERE user_id = ANY($1)',
        [userIds]
      );
      deleted.scores = scoresCount;

      const { rowCount: sessionsCount } = await client.query(
        'DELETE FROM sessions WHERE user_id = ANY($1)',
        [userIds]
      );
      deleted.sessions = sessionsCount;

      const { rowCount: usersCount } = await client.query(
        "DELETE FROM users WHERE email LIKE '__test__%'"
      );
      deleted.users = usersCount;
    }

    // Delete test console data
    const { rowCount: consoleStatusCount } = await client.query(
      "DELETE FROM console_statuses WHERE console_id LIKE '__test__%'"
    );
    deleted.consoleStatuses = consoleStatusCount;

    const { rowCount: gameStatsCount } = await client.query(
      "DELETE FROM game_stats WHERE console_id LIKE '__test__%'"
    );
    deleted.gameStats = gameStatsCount;

    // Delete orphaned sessions with test console IDs
    const { rowCount: orphanedSessions } = await client.query(
      "DELETE FROM sessions WHERE console_id LIKE '__test__%'"
    );
    deleted.sessions += orphanedSessions;

    await client.query('COMMIT');
    return deleted;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initializeDatabase,
  // Users
  findUserByEmail,
  findUserById,
  createUser,
  updateUserTotals,
  formatUser,
  // Scores
  addScore,
  getUserScores,
  // Sessions
  createSession,
  getSession,
  sessionCodeExists,
  claimSession,
  // Credits
  getCredits,
  ensureCredits,
  useFreePlay,
  addCredit,
  usePaidCredit,
  // Payments
  addPayment,
  getUserPayments,
  // Console statuses
  upsertConsoleStatus,
  getConsoleStatus,
  getAllConsoleStatuses,
  // Game stats
  upsertGameStats,
  getGameStats,
  getAllGameStats,
  // Leaderboard
  getLeaderboard,
  // Cleanup
  cleanupTestData,
};
