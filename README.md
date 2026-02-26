# Impact Arcade

A full-stack arcade gaming platform featuring **Impactman** - a Unity WebGL game deployed on Raspberry Pi kiosks with real-time fleet monitoring, QR code-based game sessions, and Apple Pay integration.

## Architecture

```
impactman-arcade-cc/
├── api/              # Express.js REST API + WebSocket server
│   ├── server.js     # Main server (Express + WebSocket)
│   ├── db.js         # PostgreSQL database layer
│   ├── auth.js       # JWT authentication
│   ├── email.js      # Resend email service
│   └── payments.js   # Square Apple Pay integration
├── website/          # Nuxt 3 frontend
│   └── client/
│       ├── pages/           # Route pages
│       ├── components/      # Vue components (atoms/molecules/organisms)
│       ├── composables/     # Shared composables (API, WebSocket, offline queue)
│       └── store/           # Pinia stores (game state, auth)
├── unity-game/       # Unity WebGL game (Impactman)
└── raspi/            # Raspberry Pi kiosk configuration scripts
```

## Quick Start

### 1. API Server

```bash
cd api
npm install
cp .env.example .env  # Configure environment variables
npm start             # Runs on http://localhost:3001
```

### 2. Website (Nuxt 3)

```bash
cd website/client
npm install
npm run dev           # Runs on http://localhost:3000
```

### 3. Kiosk Mode

Open `http://localhost:3000` - automatically redirects to `/games/impactman` for arcade display.

## Environment Variables

### API (`api/.env`)

```env
PORT=3001

# PostgreSQL (Railway auto-populates DATABASE_URL)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT Secret — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=change-me-to-a-strong-random-string

# Email (Resend)
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=Impact Arcade <noreply@impactarcade.com>

# Payments (Square)
SQUARE_APPLICATION_ID=sandbox-sq0idb-xxxxx
SQUARE_ACCESS_TOKEN=EAAAxxxxxxxxxxxxxxxx
SQUARE_LOCATION_ID=xxxxx
SQUARE_ENVIRONMENT=sandbox  # 'sandbox' or 'production'
```

### Website (`website/client/.env`)

```env
API_URL=http://localhost:3001
```

## Database Schema

PostgreSQL with 7 tables. Schema auto-initializes on first server start via `db.js`.

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Player accounts | `id` (TEXT PK), `email` (UNIQUE), `name`, `total_score`, `total_bags`, `games_played`, `role` (default `'user'`) |
| `scores` | Game score history | `id` (SERIAL), `user_id` (FK), `console_id`, `score`, `level`, `bags`, `idempotency_key` (UNIQUE) |
| `sessions` | QR code claim sessions | `code` (TEXT PK), `console_id`, `score`, `claimed`, `user_id` (FK), `expires_at` (24h) |
| `credits` | Play credits per user | `user_id` (TEXT PK, FK), `free_play_used`, `credits` |
| `payments` | Apple Pay transactions | `id` (SERIAL), `user_id` (FK), `payment_id`, `amount`, `receipt_url` |
| `console_statuses` | Pi heartbeat data | `console_id` (TEXT PK), `temperature`, `cpu_usage`, `status`, `last_seen` |
| `game_stats` | Per-console game stats | `console_id` (TEXT PK), `games_played`, `high_score`, `is_playing`, `current_level` |

## QR Code Game Flow

1. **Scan QR** — Player scans QR code on arcade machine
2. **Phone Opens** — `/play/[consoleId]` page loads
3. **Tap PLAY** — Guest first play is free, no account needed
4. **WebSocket Signal** — API sends `readyToPlay` to console via WebSocket
5. **Game Starts** — Unity game receives signal and starts
6. **Game Ends** — QR code displayed for score saving (optional)
7. **Return Plays** — $1 via Apple Pay for subsequent games

## Phone Login Flow

1. **Player scans QR** — Opens `/play/[consoleId]`
2. **Enters email** — `POST /api/users/login` creates or finds user, returns JWT
3. **Console notified** — `POST /api/consoles/:consoleId/login` sets user on console + sends WebSocket `userLoggedIn` message
4. **Arcade updates** — Polls `GET /api/consoles/:consoleId/logged-in-user` as fallback if WS missed
5. **Scores auto-save** — When game ends, `POST /api/users/:id/scores` saves with idempotency key
6. **Logout on menu** — `DELETE /api/consoles/:consoleId/logged-in-user` clears session

## API Endpoints

### Health & Info
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | No | API info + version |
| `GET` | `/health` | No | Health check (returns `{status, db, timestamp}`) |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/users/login` | No | Login/signup with email — returns JWT token |
| `GET` | `/api/users/:id` | No | User profile + top 10 scores |
| `GET` | `/api/users/:id/scores` | No | Full score history with stats |
| `POST` | `/api/users/:id/scores` | JWT | Save score (checks JWT user matches `:id`, supports `idempotencyKey`) |
| `GET` | `/api/users/:id/credits` | No | Play credits (`freePlayUsed`, `paidCredits`, `availablePlays`) |
| `POST` | `/api/users/:id/use-credit` | JWT | Use a credit (free play first, then paid) |

### Sessions (QR Score Claiming)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/sessions` | No | Create session with score data — returns 6-char code |
| `GET` | `/api/sessions/:code` | No | Get session (returns 410 if expired) |
| `POST` | `/api/sessions/:code/claim` | No | Claim session — finds/creates user, saves score, returns JWT |

### Console Control (Phone-to-Arcade)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/consoles/:consoleId/status` | No | Check if console is WebSocket-connected |
| `POST` | `/api/consoles/:consoleId/start-guest` | No | Start guest game (free first play) |
| `POST` | `/api/consoles/:consoleId/start-game` | No | Start game for logged-in user (uses credit) |
| `POST` | `/api/consoles/:consoleId/login` | No | Log user into console (sends WS `userLoggedIn`) |
| `GET` | `/api/consoles/:consoleId/logged-in-user` | No | Poll who's logged in (WS fallback) |
| `DELETE` | `/api/consoles/:consoleId/logged-in-user` | JWT | Clear logged-in user |
| `GET` | `/api/consoles/:consoleId/pending-game` | No | Check if game start is pending (arcade polls) |
| `DELETE` | `/api/consoles/:consoleId/pending-game` | No | Clear pending game after arcade starts it |

### Game Events (from Unity via arcade)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/game/start` | No | Game started on console |
| `POST` | `/api/game/update` | No | In-progress level/score update |
| `POST` | `/api/game/end` | No | Game ended with final score |
| `GET` | `/api/game/:consoleId` | No | Game stats for one console |

### Fleet Management
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/status` | No | Receive heartbeat from Pi console |
| `GET` | `/api/consoles` | No | All consoles with status + game stats |
| `GET` | `/api/consoles/:id` | No | Single console details |
| `GET` | `/api/stats` | No | Fleet summary (online/offline/playing counts, total games, top score) |
| `GET` | `/api/leaderboard` | No | Global high scores (default limit 10) |

### Payments (Apple Pay via Square)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/payments/config` | No | Square SDK config for frontend |
| `POST` | `/api/payments/apple-pay` | JWT | Process Apple Pay payment |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/verify` | Admin | Verify admin role — used by frontend middleware |
| `DELETE` | `/api/admin/cleanup-test-data` | Admin | Delete all `__test__` prefixed data from DB + in-memory maps |

## WebSocket Protocol

Console connects to `ws://[API_HOST]/` and sends messages as JSON.

### Console → Server
| Type | Payload | Description |
|------|---------|-------------|
| `register` | `{ consoleId }` | Register console, receives `registered` ack |
| `gameStarted` | `{}` | Confirm game has started |
| `gameEnded` | `{ userId, score, level, bags }` | Report final score (auto-saves for logged-in users) |

### Server → Console
| Type | Payload | Description |
|------|---------|-------------|
| `registered` | `{ consoleId }` | Registration acknowledged |
| `readyToPlay` | `{ userId, userName }` or `{ guestSessionId, isGuest }` | Start the game |
| `userLoggedIn` | `{ id, name, email }` | Phone user logged into this console |
| `userLoggedOut` | `{}` | User cleared from console |
| `scoreSaved` | `{ score, user }` | Score auto-saved for logged-in user |

## Frontend Pages

| Path | Layout | Description |
|------|--------|-------------|
| `/` | default | Landing page |
| `/games/impactman` | naked | Unity game host (arcade kiosk display) |
| `/play/[consoleId]` | naked | Phone control page (scan QR to open) |
| `/login` | naked | Email login page |
| `/dashboard/[id]` | naked | Player dashboard (scores, credits, Apple Pay) |
| `/fleet` | default | Fleet monitor (console grid + stats) |
| `/missioncontrol` | naked | Admin test dashboard (system tests, UX tests, fleet UI) |

## Admin Test Dashboard

Navigate to `/missioncontrol` to access the comprehensive test suite (admin role required). Four tabs:

### System Tests (9 tests)
Validates API infrastructure: health check, all GET endpoints, JWT auth rejection (no token + bad token), WebSocket connect/register handshake, console status POST.

### UX Tests (15 tests)
End-to-end user flows run sequentially — each test builds on the prior:
1. User signup → login → profile → scores
2. Score save with auth → idempotency check
3. Console login → poll → clear
4. Session create → get → claim
5. Credits get → use credit
6. Offline queue enqueue → sync

Tests create ephemeral data with `__test__` prefix emails. Use the **Cleanup Test Data** button to delete all test data (requires admin role).

### Doc Fact-Check (15 tests)
Verifies README documentation accuracy by hitting every documented API endpoint and checking response shapes match documented fields. Covers health, users, sessions, consoles, stats, leaderboard, payments config, admin auth, WebSocket protocol, and score save response format.

### Fleet UI
Live fleet monitor (same as `/fleet` page) — stats row + console card grid, auto-refreshes every 10s.

## Key Composables

| Composable | File | Description |
|------------|------|-------------|
| `useConsoleSocket` | `composables/useConsoleSocket.ts` | WebSocket client for arcade consoles (register, auto-reconnect, message handlers) |
| `useOfflineQueue` | `composables/useOfflineQueue.ts` | localStorage queue for failed API requests (auto-sync, idempotency, 30s interval) |
| `useApiCall` / `$apiCall` | `composables/useApiCall.ts` | API fetch wrapper (auto-injects JWT, snake_case ↔ camelCase conversion) |

## Deployment

### Railway
The API is configured for Railway deployment:
- Root route `/` returns API info
- Uses `PORT` environment variable
- `DATABASE_URL` auto-populated by Railway PostgreSQL
- WebSocket support via HTTP server upgrade

### Raspberry Pi Kiosk
See `raspi/CONSOLE_SETUP.md` for full setup guide:
- Raspberry Pi 5 (4GB) + 32GB microSD
- Chromium kiosk mode via Cage
- Auto-start on boot
- Monitoring agent reports to API every 30s

## Tech Stack

- **API**: Node.js, Express 5, WebSocket (ws), PostgreSQL (pg)
- **Auth**: JWT (jsonwebtoken, 7-day expiry)
- **Frontend**: Nuxt 3, Vue 3, Tailwind CSS, Pinia
- **Game**: Unity WebGL
- **Email**: Resend
- **Payments**: Square Web Payments SDK (Apple Pay)
- **Offline**: localStorage queue with idempotency
- **Hosting**: Railway (API + DB), Raspberry Pi (kiosks)

## License

Proprietary - Impact Arcade
