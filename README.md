# 7StarExperts — Backend API

Node.js + Express + TypeScript + PostgreSQL + Prisma

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Then fill in your actual values in .env
```

### 3. Set up the database
You need PostgreSQL. Free options:
- **Local**: Install PostgreSQL on your machine
- **Cloud (Free)**: [Supabase](https://supabase.com) or [Neon](https://neon.tech)

```bash
# Push schema to DB (dev)
npm run db:push

# Or create a migration (recommended for teams)
npm run db:migrate

# Seed with initial data (categories, admin user)
npm run db:seed

# Open Prisma Studio (visual DB browser)
npm run db:studio
```

### 4. Start development server
```bash
npm run dev
```

Server runs at: `http://localhost:5000`

---

## 📁 Project Structure

```
src/
├── config/          # DB connection, env variables
├── middleware/       # Auth, error handling, validation
├── modules/          # Feature modules (auth, users, bookings...)
│   ├── auth/         # OTP login, JWT tokens
│   ├── users/        # User profiles, addresses
│   ├── services/     # Service listings (Phase 2)
│   ├── bookings/     # Booking management (Phase 2)
│   ├── payments/     # Razorpay integration (Phase 4)
│   ├── reviews/      # Ratings & reviews (Phase 4)
│   └── ...
├── routes/           # Central route index
├── utils/            # JWT, OTP, response helpers
└── server.ts         # Entry point
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP & login |
| POST | `/api/auth/refresh-token` | Get new access token |
| GET  | `/api/auth/me` | Get current user |
| POST | `/api/auth/fcm-token` | Update push notification token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/users/profile` | Get user profile |
| PUT  | `/api/users/profile` | Update profile |
| GET  | `/api/users/addresses` | Get saved addresses |
| POST | `/api/users/addresses` | Add new address |
| DELETE | `/api/users/addresses/:id` | Delete address |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check if API is running |

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
```

### Login Flow
1. `POST /api/auth/send-otp` → sends SMS OTP
2. `POST /api/auth/verify-otp` → returns `accessToken` + `refreshToken`
3. Use `accessToken` in `Authorization` header for all protected routes
4. When access token expires, call `POST /api/auth/refresh-token` with `refreshToken`

---

## 📦 Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema to DB (no migration history)
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:seed      # Seed database with initial data
```

---

## 🌱 Development Phases

- [x] **Phase 1** — Foundation: Auth, Users, DB Schema
- [ ] **Phase 2** — Booking Flow: Categories, Services, Bookings
- [ ] **Phase 3** — Real-time: Socket.io Chat, Location Tracking, FCM
- [ ] **Phase 4** — Payments: Razorpay, Reviews
- [ ] **Phase 5** — Admin Panel APIs
