# TIMEPASS — Random Video Chat & Social Discovery Platform

> **"Meet Someone New. Anytime."**

A complete, production-ready full-stack random video and text discovery platform inspired by Omegle, engineered with an original modern dark-navy aesthetic, WebRTC peer-to-peer encryption, proactive safety architecture, interest-based matchmaking, and administrator oversight.

---

## 🌟 Key Features

### 1. Brand Identity & UI/UX
- **Modern Aesthetic**: Deep navy/black dark mode with purple-blue gradient accents (`#6366f1`, `#8b5cf6`, `#38bdf8`), subtle glow borders, and glassmorphic floating toolbars.
- **Theme Switcher**: Instant toggle between Dark and Light mode, persisting in `localStorage`.
- **Procedural Web Audio**: Zero external audio dependencies. Sound synthesizer uses Web Audio API for match chimes, message pings, and disconnect cues.
- **Confetti Celebrations**: Canvas-confetti triggers upon successful matching and friend connections.
- **Responsive Layout**: Designed mobile-first for smartphones, tablets, laptops, and 4K displays.

### 2. Multi-Method Authentication & Onboarding
- **Instant Guest Mode**: Start chatting immediately with a customized display name and avatar without mandatory sign-up.
- **Mobile OTP Authentication**: 6-digit cryptographic verification codes with countdown resend timer and dev sandbox auto-fill.
- **Email & Password**: Password hashing with `bcryptjs` and session tokens with `jsonwebtoken`.
- **Google OAuth**: One-click profile synchronization ready for Google OAuth.
- **18+ Age Assurance**: Enforces strict confirmation that user is of legal age before entering queues.
- **GDPR Account Deletion**: One-click complete account and conversation data erasure.

### 3. Instant Random Video Chat (Real WebRTC)
- **Peer-to-Peer Encryption**: Video and audio stream directly device-to-device via standard WebRTC DTLS-SRTP. Zero video recording or server storage.
- **Smart Signaling**: WebSocket-based SDP Offer/Answer negotiation and ICE candidate trickling.
- **Media Controls**:
  - Microphone mute/unmute
  - Camera video on/off toggle (with fallback avatar)
  - Camera flip (cycles `user` vs `environment` on mobile/multi-cam devices)
  - Fullscreen video toggle
  - In-call device settings modal to select specific camera or microphone inputs
- **Prominent NEXT Button**: Automatically notifies peer, gracefully tears down peer connection while keeping camera warm, and immediately re-queues user. Keyboard shortcut: `[Esc]`.
- **Integrated In-Call Chat**: Expandable drawer with live typing indicators (`Stranger is typing...`), emoji picker, and shared interest badges.

### 4. 8-Member Custom Rooms
- **Squad Lounges**: Up to 8 concurrent members per room across categories:
  - 🎮 **Gaming**: Squad matchmaking and squad mic chat (BGMI, Valorant, etc.)
  - 🎵 **Music**: Late night Bollywood Antakshari & synchronized Jam sessions
  - ☕ **Hangout**: Chai Pe Charcha & 3 AM thoughts
  - 🍿 **Movies**: Cinema & Anime watch talk
  - 💻 **Tech**: Night Owl Devs & Hackathon chill
- **WebRTC Multi-Peer Mesh**: Real-time audio and video streaming directly between all 8 room participants.
- **Synchronized Room DJ**: Play, sync, and jam to iconic Bollywood romance hits with room-wide track sync.
- **Clean Group Room Chat**: Instant text messaging, floating emoji reactions, and live presence indicator.

### 5. Smart Matchmaking Engine
- **Fair Scoring**:
  - Language match: +20 points
  - Common interest overlap: +10 points each
  - Anti-starvation boost: +1 point per 3 seconds in queue
- **Anti-Rematch Guarantee**: Excludes immediate previous conversation partner to prevent looping back to the same person on NEXT.
- **Blocklist Filtering**: Cross-checks blocked user IDs to ensure blocked peers never match.
- **Atomic Pair Assignment**: Prevents race conditions and duplicate slot allocations.

### 6. Proactive Safety & Admin Dashboard (`/admin`)
- **Report & Block**: Accessible in every call and chat. Automatically terminates the session, adds the user to the blocklist, and files a report.
- **Automated Text Filter**: Scans and censors toxic keywords and harassment.
- **Token Bucket Rate Limiter**: Throttles message and skip floods (10 tokens / 5s window).
- **Admin Dashboard** (`/admin` with key `admin123`):
  - Live analytics (online users, active video calls, text chats, queue lengths)
  - Report queue with details, status, and one-click actions:
    - **Dismiss Report**
    - **Warn User**
    - **Suspend 24 Hours**
    - **Suspend 7 Days**
    - **Permanent Ban**
  - User directory with ban status and ban/unban toggles.

### 7. Private Direct Rooms (`/room/:id`)
- Generates secure shareable invite links for 2 friends to connect directly via WebRTC without going through the random queue.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Real-Time Signaling** | Node.js, Express, Socket.IO 4 |
| **P2P Streaming** | WebRTC (`RTCPeerConnection`, `getUserMedia`, Google STUN / configurable coturn) |
| **Database & ORM** | Prisma ORM with SQLite (zero-config local) & PostgreSQL ready |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs`, Mobile OTP gateway, Google OAuth ready |
| **Testing** | Vitest (16 unit and end-to-end integration tests) |

---

## 📂 Project Directory Structure

```
TIMEPASS/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Profile, Conversation, Report, Block, etc.)
│   └── seed.ts                # Database seeder with Admin, Moderator, and sample users
├── server/
│   ├── db.ts                  # Prisma Client singleton
│   ├── index.ts               # Express + Socket.IO + Next.js unified server
│   ├── matchmaker.ts          # Matchmaking engine with anti-starvation & blocklist filtering
│   ├── moderation.ts          # Profanity filter, rate limiters, ban checking
│   ├── signaling.ts           # WebRTC SDP/ICE signaling and in-call messaging
│   └── routes/
│       ├── admin.ts           # /api/admin stats, reports queue, moderation actions
│       ├── auth.ts            # /api/auth login, register, guest, OTP, delete
│       ├── profile.ts         # /api/profile update, friends, blocks, history
│       └── rooms.ts           # /api/rooms private room creation
├── src/
│   ├── app/
│   │   ├── admin/page.tsx     # Admin Oversight & Moderation Dashboard
│   │   ├── globals.css        # Tailwind styles, glassmorphism, animations
│   │   ├── layout.tsx         # Root layout with ThemeProvider and AuthProvider
│   │   ├── page.tsx           # Home landing page with hero and interest chips
│   │   ├── privacy/page.tsx   # P2P privacy policy & GDPR compliance
│   │   ├── profile/page.tsx   # User profile, friends list, block list, history
│   │   ├── room/[id]/page.tsx # Private 1-on-1 direct video room
│   │   ├── safety/page.tsx    # Community guidelines & prohibited behaviors
│   │   ├── terms/page.tsx     # Terms of Service (18+ requirement)
│   │   ├── text/page.tsx      # Random 1-on-1 text chat screen
│   │   └── video/page.tsx     # Core Instant Random Video Chat screen
│   ├── components/
│   │   ├── AuthModal.tsx      # Multi-method authentication dialog
│   │   ├── CallControls.tsx   # Floating glassmorphic call controls toolbar
│   │   ├── ChatDrawer.tsx     # In-call real-time chat drawer
│   │   ├── DeviceSettingsModal.tsx # Hardware camera & microphone selector
│   │   ├── Footer.tsx         # Standard footer with safety links
│   │   ├── MatchingRadar.tsx  # Pulsing radar search animation with icebreakers
│   │   ├── Navbar.tsx         # Header with live online counter & profile menu
│   │   ├── ReportModal.tsx    # Report & Block dialog
│   │   └── VideoPlayer.tsx    # Local & remote video stream renderer
│   └── lib/
│       ├── auth-context.tsx   # AuthContext and persistent session state
│       ├── socket.ts          # Socket.IO client factory
│       ├── sound.ts           # Procedural Web Audio API sound generator
│       ├── theme-context.tsx  # Dark / Light theme provider
│       ├── types.ts           # TypeScript interfaces
│       ├── utils.ts           # Helper functions, interest and language lists
│       └── webrtc.ts          # RTCPeerConnection manager with STUN/TURN
├── tests/
│   ├── auth.test.ts           # Password hashing & JWT tests
│   ├── matchmaker.test.ts     # Matchmaking queue, blocking, and rematch tests
│   ├── moderation.test.ts     # Profanity filter and rate limiting tests
│   └── server-api.test.ts     # End-to-end API and Socket.IO integration tests
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # Custom color palettes and animations
└── tsconfig.json              # TypeScript configuration
```

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js v18+ (tested on Node.js v20 and v24)
- npm or pnpm

### Step 1: Clone & Install Dependencies
```bash
git clone <repo-url>
cd TIMEPASS
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment configurations in `.env`:
```env
PORT=3000
NODE_ENV=development
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="timepass_jwt_production_secret_key_needs_to_be_long_and_secure_64chars"
ADMIN_SECRET_KEY="admin123"
```

### Step 3: Initialize Database & Run Seed
```bash
# Push schema to SQLite
npx prisma db push

# Seed Admin account and sample reports
npm run db:seed
```

Pre-seeded accounts:
- **Admin**: `admin@timepass.chat` (Password: `admin123`)
- **Admin Key**: `admin123` (accessible at `/admin`)
- **Demo User**: `elena@example.com` (Password: `password123`)

### Step 4: Run Automated Tests
```bash
npm run test
```
All 16 unit and integration tests will execute.

### Step 5: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📡 WebRTC & STUN/TURN Configuration

TIMEPASS connects peers via WebRTC. By default, it connects to Google's public STUN servers:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`
- `stun:stun2.l.google.com:19302`

### Restrictive NATs & Symmetric Firewalls (TURN Server)
For users behind restrictive corporate firewalls or symmetric mobile carrier NATs where direct STUN peer-to-peer reflection fails, configure a TURN server (such as [coturn](https://github.com/coturn/coturn) or Twilio Network Traversal) in your `.env`:

```env
TURN_SERVER_URL="turn:turn.example.com:3478"
TURN_SERVER_USERNAME="timepass_turn_user"
TURN_SERVER_CREDENTIAL="your_turn_password"
```

---

## 🛡️ Moderation & Safety Workflow

1. **In-Call Reporting**: Clicking the Shield icon opens the Report Modal. Users can select from 6 categories (Inappropriate Video, Harassment, Bots, Underage, Violence, Other) and enter details.
2. **Instant Disconnect**: Submitting a report terminates the WebRTC session immediately and adds the offender to the reporter's personal blocklist so they are never paired again.
3. **Admin Queue**: Reports are transmitted to `/admin`, where moderators can review report details and take one-click action:
   - **Dismiss** (marks report resolved)
   - **Warn** (flags account)
   - **Suspend 24 Hours** (rejects queue entry until expiration)
   - **Suspend 7 Days** (temporary 1-week block)
   - **Permanent Ban** (blocks user ID and future sessions)
4. **Automated Keyword Scanner**: Live chat messages are automatically scanned for toxic profanity and replaced with `*** [Blocked by Safety Filter] ***`.
5. **Rate Limiting**: Sockets exceeding 10 messages per 5 seconds are rate-limited.

---

## 🚢 Production Deployment

### Docker Deployment
Build and run via Docker:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

### PostgreSQL Migration (Supabase / AWS RDS)
To switch from SQLite to PostgreSQL in production:
1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/timepass?schema=public"
   ```
3. Run `npx prisma db push` or `npx prisma migrate deploy`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
