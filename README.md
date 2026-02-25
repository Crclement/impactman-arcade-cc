# Impact Arcade

A full-stack arcade gaming platform featuring **Impactman** - a Unity WebGL game deployed on Raspberry Pi kiosks with real-time fleet monitoring, QR code-based game sessions, and Apple Pay integration.

## Architecture

```
impactman-arcade-cc/
├── api/              # Express.js REST API + WebSocket server
├── website/          # Nuxt 3 frontend (dashboard + game host)
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
npm run dev           # Runs on http://localhost:3003
```

### 3. Kiosk Mode

Open `http://localhost:3003` - automatically redirects to `/games/impactman` for arcade display.

## Environment Variables

### API (`api/.env`)

```env
PORT=3001

# Email (Resend)
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@impactarcade.com

# Payments (Square)
SQUARE_ACCESS_TOKEN=sandbox-sq0idb-xxxxx
SQUARE_APPLICATION_ID=sandbox-sq0idp-xxxxx
SQUARE_LOCATION_ID=xxxxx
SQUARE_ENVIRONMENT=sandbox
```

### Website (`website/client/.env`)

```env
API_URL=http://localhost:3001
PUSHER_ID=xxxxx
```

## QR Code Game Flow

1. **Scan QR** - Player scans QR code on arcade machine
2. **Phone Opens** - `/play/[consoleId]` page loads
3. **Tap PLAY** - Guest first play is free, no account needed
4. **WebSocket Signal** - API sends `readyToPlay` to console via WebSocket
5. **Game Starts** - Unity game receives signal and starts
6. **Game Ends** - QR code displayed for score saving (optional)
7. **Return Plays** - $1 via Apple Pay for subsequent games

## API Endpoints

### Health & Info
- `GET /` - API info
- `GET /health` - Health check

### Consoles
- `GET /api/consoles` - List all consoles with status
- `GET /api/consoles/:id` - Single console details
- `GET /api/consoles/:consoleId/status` - Check if console is connected
- `POST /api/consoles/:consoleId/start-guest` - Start guest game (free first play)
- `POST /api/consoles/:consoleId/start-game` - Start game for logged-in user

### Game Events (from Unity)
- `POST /api/game/start` - Game started
- `POST /api/game/update` - Level/score update
- `POST /api/game/end` - Game ended with final score

### Sessions (QR Score Claiming)
- `POST /api/sessions` - Create session with score
- `GET /api/sessions/:code` - Get session by code
- `POST /api/sessions/:code/claim` - Claim session to user account

### Users
- `POST /api/users/login` - Login/signup with email
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/scores` - Get score history
- `GET /api/users/:id/credits` - Get play credits
- `POST /api/users/:id/use-credit` - Use a play credit

### Payments
- `GET /api/payments/config` - Get Square config for frontend
- `POST /api/payments/apple-pay` - Process Apple Pay payment

### Fleet Management
- `POST /api/status` - Receive status from Pi console
- `GET /api/stats` - Fleet summary statistics
- `GET /api/leaderboard` - Global high scores

## WebSocket Protocol

Console connects to `ws://[API_HOST]/` and registers:

```json
{ "type": "register", "consoleId": "IMP-001" }
```

Server sends game start signal:

```json
{ "type": "readyToPlay", "userId": "usr_xxx", "userName": "Player" }
```

Or for guest:

```json
{ "type": "readyToPlay", "guestSessionId": "guest_xxx", "isGuest": true }
```

Console confirms game started:

```json
{ "type": "gameStarted" }
```

Console reports game ended:

```json
{ "type": "gameEnded", "userId": "usr_xxx", "score": 12500, "level": 8, "bags": 25 }
```

## Deployment

### Railway

The API is configured for Railway deployment:
- Root route `/` returns API info
- Uses `PORT` environment variable
- WebSocket support via HTTP server upgrade

### Raspberry Pi Kiosk

See `raspi/` directory for:
- Chromium kiosk mode configuration
- Auto-start scripts
- Status monitoring agent

## Tech Stack

- **API**: Node.js, Express, WebSocket (ws)
- **Frontend**: Nuxt 3, Vue 3, Tailwind CSS
- **Game**: Unity WebGL
- **Email**: Resend
- **Payments**: Square Web Payments SDK (Apple Pay)
- **Hosting**: Railway (API), Raspberry Pi (kiosks)

## License

Proprietary - Impact Arcade
