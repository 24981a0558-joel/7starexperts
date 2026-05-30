@AGENTS.md

# 7Star Worker App — Claude Code Guide

## Project Overview
Provider/worker-facing mobile app for the 7StarExperts platform. Built with **Expo SDK 56** + **React Native 0.85** + **expo-router v4**.

- **Role**: Service providers (plumbers, electricians, cleaners, etc.) use this to receive, accept, and complete jobs
- **Companion repos**: Backend at `/Users/selvin/7starexperts-backend`, Customer app at `/Users/selvin/7star`
- **Green palette**: Primary `#059669` (emerald) — differentiated from customer app's blue `#208AEF`

---

## Quick Start

```bash
cd /Users/selvin/7starworker
npm start            # Expo dev server (Metro)
npm run ios          # iOS Simulator
npm run android      # Android Emulator
```

Backend must be running on port 5001:
```bash
cd /Users/selvin/7starexperts-backend && npm run dev
```

### Android Emulator
API URL automatically switches: `http://10.0.2.2:5001/api` (emulator) vs `http://localhost:5001/api` (iOS/physical).

---

## Architecture

```
src/
  app/
    _layout.tsx          # Root Stack + AuthProvider
    index.tsx            # → Redirect to /(auth)/login
    (auth)/
      _layout.tsx        # Redirect to /(tabs) if token exists
      login.tsx          # Phone number entry (gradient hero)
      otp.tsx            # 6-digit OTP verification
    (tabs)/
      _layout.tsx        # Bottom tabs: Dashboard | Jobs | Earnings | Profile
      index.tsx          # Dashboard: availability toggle, today's stats, wallet
      jobs.tsx           # All jobs with status filter tabs
      earnings.tsx       # Wallet balance + transaction history + payout request
      profile.tsx        # Provider info, stats, menu items, logout
    job/
      [id].tsx           # Job detail + Accept/Reject/EnRoute/Complete actions
  components/
    JobCard.tsx          # Reusable job card (service, customer, date, earning)
    ui/
      Button.tsx         # Primary/outline/danger variants, supports icon prop
      Badge.tsx          # Status badge (color-coded)
      LoadingSpinner.tsx # Full-screen or inline activity indicator
  constants/
    colors.ts            # Green palette + status color helpers
  context/
    auth-context.tsx     # AuthProvider: user, providerProfile, token, loading
  lib/
    api.ts               # fetch-based API client; all provider endpoints
    config.ts            # API_URL (platform-aware)
```

---

## Auth Flow

1. `index.tsx` → `<Redirect href="/(auth)/login" />`
2. `(auth)/_layout.tsx` — if token → `<Redirect href="/(tabs)" />`
3. Login: 10-digit phone → `POST /auth/send-otp`
4. OTP: 6 digits → `POST /auth/verify-otp` with `role: "PROVIDER"`
5. Response: `data.tokens.accessToken` (NOT `data.accessToken` — nested!)
6. Token stored in `SecureStore` with key `worker_auth_token`
7. `(tabs)/_layout.tsx` — if no token → `<Redirect href="/(auth)/login" />`
8. Logout: clears SecureStore + state → redirected to login automatically

### Critical: OTP Response Shape
```typescript
// CORRECT:
const res = await authApi.verifyOtp(phone, otp);
await login(res.data.tokens.accessToken, res.data.user);

// WRONG (common mistake):
await login(res.data.accessToken, ...);   // undefined!
```

---

## API Client (`src/lib/api.ts`)

### Auth
```typescript
authApi.sendOtp(phone)          // POST /auth/send-otp  — bare 10-digit, no +91
authApi.verifyOtp(phone, otp)   // POST /auth/verify-otp  — role: "PROVIDER"
authApi.getMe()                 // GET /auth/me
```

### Provider
```typescript
providerApi.getMyProfile()          // GET /providers/me/profile
providerApi.updateProfile(data)     // PUT /providers/me/profile
providerApi.toggleAvailability(bool) // PATCH /providers/me/toggle
providerApi.getWallet()             // GET /providers/me/wallet → WalletInfo
providerApi.getEarnings()           // GET /providers/me/earnings → EarningEntry[]
providerApi.requestPayout(amount)   // POST /providers/me/payout
```

### Bookings
```typescript
bookingsApi.getMine(params?)        // GET /bookings (provider sees their assigned jobs)
bookingsApi.getById(id)             // GET /bookings/:id
bookingsApi.updateStatus(id, status, reason?)  // PATCH /bookings/:id/status
```

### Booking Status Flow
```
PENDING → ACCEPTED → EN_ROUTE → IN_PROGRESS → COMPLETED
                     ↓
                  REJECTED (from PENDING only)
```

---

## Key Types

```typescript
export type BookingStatus =
  | 'PENDING' | 'ACCEPTED' | 'EN_ROUTE' | 'IN_PROGRESS'
  | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export interface Booking {
  id: string;
  status: BookingStatus;
  scheduledAt: string;          // ISO date string
  notes: string | null;
  totalAmount: number;
  providerEarning: number;      // 85% of totalAmount (after 15% platform fee)
  service: { id; name; duration; price?; image: string | null };
  customer: { id; name: string | null; phone: string };
  address: { fullAddress; lat; lng } | null;
  createdAt: string;
}

export interface WalletInfo {
  balance: number;      // available to withdraw
  totalEarned: number;  // lifetime earnings
  totalPaid: number;    // lifetime payouts
}

export interface EarningEntry {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  createdAt: string;
}
```

---

## Context (`useAuth`)

```typescript
const {
  user,            // User | null
  providerProfile, // ProviderProfile | null (null if profile not created yet)
  token,           // string | null
  loading,         // boolean (initial load)
  login,           // (token, user) => Promise<void>
  logout,          // () => Promise<void>
  refreshProfile,  // () => Promise<void> — re-fetches provider profile
} = useAuth();
```

---

## Colors (`src/constants/colors.ts`)

```typescript
Colors.primary       // '#059669' — emerald green
Colors.primaryLight  // '#ECFDF5' — light green tint
Colors.background    // '#F8F9FA'
Colors.cardBackground // '#FFFFFF'
Colors.textPrimary   // '#1A1A1A'
Colors.textSecondary // '#6B7280'
Colors.textMuted     // '#9CA3AF'
Colors.success       // '#10B981'
Colors.warning       // '#F59E0B'
Colors.error         // '#EF4444'
Colors.border        // '#E5E7EB'
Colors.divider       // '#F3F4F6'
```

---

## Common Patterns

### Loading + data fetch
```typescript
const [data, setData] = useState<Thing | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  thingApi.get().then(res => setData(res.data)).finally(() => setLoading(false));
}, []);

if (loading) return <LoadingSpinner fullScreen />;
```

### Pull-to-refresh
```typescript
const [refreshing, setRefreshing] = useState(false);
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await fetchData();
  setRefreshing(false);
}, []);

<FlatList refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />} ... />
```

### Confirmation dialog before destructive action
```typescript
Alert.alert('Confirm', 'Are you sure?', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Confirm', onPress: () => doThing() },
]);
```

---

## Known Issues & Fixes

| Issue | Fix |
|-------|-----|
| Network error on Android | Backend not running, or using `localhost` instead of `10.0.2.2` |
| OTP "invalid or expired" | Token response shape — must read `res.data.tokens.accessToken` |
| 400 validation on send-otp | Sending `+916300908637` — must send bare `6300908637` (10 digits) |
| 403 on POST /bookings | Phone `6300908637` is ADMIN role — backend fixed to allow ADMIN as customer |

---

## TypeScript

- Strict mode enabled
- `@/*` path alias maps to `./src/*`
- `typedRoutes: false` in `app.json` (prevents stale route type errors)
- Run `npx tsc --noEmit` to type-check (ignore `animated-icon.module.css` and `@/global.css` scaffold errors)

---

## Installed Packages (beyond Expo default)

- `expo-secure-store` — JWT persistence (`worker_auth_token`)
- `expo-linear-gradient` — gradient hero on login/OTP screens
- `@expo/vector-icons` — Ionicons throughout the app
