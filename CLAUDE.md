# 7StarExperts — Backend API

## What This Is
A Node.js/Express REST API for a home services marketplace (like Urban Company).
Customers book services (cleaning, plumbing, etc.), providers accept and complete them.
Payments via Razorpay. Real-time chat/tracking via Socket.io. OTP auth via Twilio.

## Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon serverless) via Prisma ORM
- **Auth**: JWT (accessToken 7d + refreshToken 30d)
- **OTP**: Twilio (dev mode: logs to terminal, no SMS sent)
- **Payments**: Razorpay
- **Real-time**: Socket.io
- **Notifications**: Firebase FCM

## Start the Server
```bash
npm run dev          # dev with hot-reload (ts-node-dev)
npm run build        # compile TypeScript → dist/
npm start            # run compiled dist/
```
Server runs on **port 5001** (macOS AirPlay occupies 5000).

## Environment Variables (`.env`)
```
DATABASE_URL=        # Neon pooler URL (no &channel_binding=require — breaks on hotspot)
DIRECT_URL=          # Neon direct URL (for Prisma migrations)
JWT_SECRET=
JWT_REFRESH_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
PORT=5001
NODE_ENV=development
```

## API Routes Summary
All routes prefixed with `/api/`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/send-otp | — | Send OTP (dev: logs to terminal) |
| POST | /auth/verify-otp | — | Verify OTP → returns accessToken + user |
| POST | /auth/refresh-token | — | Get new accessToken using refreshToken |
| GET | /auth/me | ✓ | Get current user profile |
| GET | /categories | — | List active categories |
| GET | /categories/:id | — | Category with its services |
| POST | /categories | ADMIN | Create category |
| PUT | /categories/:id | ADMIN | Update category |
| DELETE | /categories/:id | ADMIN | Deactivate category |
| GET | /services | — | List services (paginated) |
| GET | /services/:id | — | Service detail + available providers |
| POST | /services | ADMIN | Create service |
| PUT | /services/:id | ADMIN | Update service |
| DELETE | /services/:id | ADMIN | Deactivate service |
| POST | /bookings | CUSTOMER/ADMIN | Create booking |
| GET | /bookings | ✓ | My bookings (filtered by role) |
| GET | /bookings/:id | ✓ | Booking detail |
| PATCH | /bookings/:id/status | ✓ | Update status (cancel/accept/complete) |
| GET | /bookings/admin/all | ADMIN | All bookings |
| GET | /bookings/admin/stats | ADMIN | Dashboard stats |
| GET | /payments | ADMIN | All payments |
| POST | /payments/refund | ADMIN | Refund a payment |
| GET | /providers | — | List verified providers |
| GET | /providers/:id | — | Provider profile |
| PATCH | /providers/:id/status | ADMIN | Approve/suspend provider |
| GET | /reviews | — | All reviews |
| DELETE | /reviews/:id | ADMIN | Delete review |
| GET | /users/profile | ✓ | User profile |
| PUT | /users/profile | ✓ | Update name/email |
| GET | /users/addresses | ✓ | User's saved addresses |
| POST | /users/addresses | ✓ | Add address |
| DELETE | /users/addresses/:id | ✓ | Remove address |
| GET | /logs | ADMIN | Activity audit log |

## Key Architecture Patterns

### Request Flow
```
Request → Express Router → validate middleware (Joi) → protect middleware (JWT) → Controller → Service → Prisma → DB
```

### Auth Middleware
- `protect` — verifies JWT, attaches `req.user = { id, phone, role }`
- `restrictTo('ROLE')` — checks `req.user.role` against allowed roles
- **Do NOT use `adminOnly`** — that doesn't exist. Use `restrictTo('ADMIN')`.

### Response Helpers (`src/utils/response.util.ts`)
```typescript
sendSuccess(res, data, message, statusCode?)   // { success: true, data, message }
sendPaginated(res, data, total, page, limit)    // adds pagination meta
```

### Error Handling
- `throw new AppError('message', statusCode)` — handled by globalErrorHandler
- `asyncHandler(fn)` — wraps async controllers to catch promise rejections

### Activity Logging
```typescript
await logActivity(req, {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUSPEND' | 'ACTIVATE' | 'APPROVE' | 'REJECT',
  entity: 'Service' | 'Category' | 'Provider' | 'User' | 'Booking' | 'Payment' | 'Review',
  entityId: id,
  entityName: name,    // optional
  changes: req.body,   // optional diff
});
// logActivity never throws — it silently fails to not break the main request
```

## Database Schema (Key Models)

### User
```
id, name, phone (unique), email, role (CUSTOMER|PROVIDER|ADMIN), isActive, fcmToken
```

### Booking Status Flow
```
PENDING → ACCEPTED → EN_ROUTE → IN_PROGRESS → COMPLETED
       ↘ REJECTED
       ↘ CANCELLED (by customer or provider)
```

### Booking
```
id, customerId, providerId?, serviceId, addressId, status, scheduledAt,
totalAmount, platformFee (15%), providerEarning (85%), notes, cancellationReason
```

### OTP
```
id, phone, code (6-digit), expiresAt (10min), isUsed
```
No FK to users — OTPs can be created before user exists (first-time login).

### Address
```
id, userId, label, fullAddress, landmark?, lat, lng, isDefault
```
Lat/lng default to 0 when created from plain text (customer app auto-creates on booking).

## OTP in Dev Mode
OTP is printed to the terminal — no SMS is sent:
```
📱 OTP for 6300908637: 123456
```
Rate limit: 5/hour per IP in production, 1000/hour in development (`NODE_ENV=development`).

## Phone Number Format
Backend validates: `^[6-9]\d{9}$` — **10 digits only, no country code, no +91**.
Send `6300908637` not `+916300908637`.

## Verify-OTP Response Shape
```json
{
  "success": true,
  "data": {
    "isNewUser": false,
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    },
    "user": {
      "id": "uuid",
      "name": "User8637",
      "phone": "6300908637",
      "email": null,
      "role": "ADMIN",
      "providerStatus": null
    }
  }
}
```
The token is at `data.tokens.accessToken` — **not** `data.accessToken`.

## Booking Creation
Accepts either `addressId` (saved address UUID) or `address` (plain text string).
When `address` text is given, a new Address record is auto-created with lat/lng=0.

## Roles & Booking Permissions
- `CUSTOMER` and `ADMIN` can create bookings
- `PROVIDER` can accept/reject/complete bookings
- `ADMIN` can do everything

## Neon DNS Issue (ISP blocks .neon.tech)
If `ENOTFOUND` on startup:
```bash
# Permanent fix — change DNS to Cloudflare/Google
sudo networksetup -setdnsservers Wi-Fi 1.1.1.1 8.8.8.8
# Then restart terminal and npm run dev
```
Remove `&channel_binding=require` from DATABASE_URL (breaks on mobile hotspot).

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ENOTFOUND db.neon.tech` | ISP DNS blocks Neon | Change DNS to 1.1.1.1/8.8.8.8 |
| `POST /auth/send-otp 400` | Phone sent with +91 prefix | Send 10 digits only: `6300908637` |
| `POST /auth/verify-otp 400 Invalid OTP` | OTP already used | Request a new OTP |
| `POST /bookings 403` | User role is ADMIN/PROVIDER | ADMIN now allowed — was a bug, fixed |
| `adminOnly is not exported` | Wrong import name | Use `restrictTo('ADMIN')` |
| Port 5001 in use | Previous process still running | `kill -9 $(lsof -ti :5001)` |
| `channel_binding` error on hotspot | SSL negotiation fails | Remove from DATABASE_URL |

## Module Structure
```
src/
  app.ts              # Express setup, middleware, rate limiting
  server.ts           # HTTP server + Socket.io init
  config/
    database.ts       # Prisma client singleton
    env.ts            # Validated env vars (throws on missing)
  middleware/
    auth.middleware.ts     # protect + restrictTo
    error.middleware.ts    # globalErrorHandler + asyncHandler + AppError
    validate.middleware.ts # Joi validation + shared schemas (phone, otp, email)
  modules/
    auth/             # OTP send/verify, JWT, user creation
    bookings/         # Full booking lifecycle
    categories/       # Category CRUD
    services/         # Service CRUD
    providers/        # Provider profiles + approval
    users/            # Profile + addresses
    payments/         # Razorpay + refunds
    reviews/          # Customer reviews
    chat/             # Socket.io chat rooms
    notifications/    # Firebase FCM push
    logs/             # Activity audit log
  utils/
    otp.util.ts       # Generate, send, verify OTP
    jwt.util.ts       # Sign/verify access + refresh tokens
    response.util.ts  # sendSuccess, sendPaginated helpers
    activity-log.util.ts  # logActivity (never throws)
```
