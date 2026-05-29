# 7StarExperts — Customer App

## What This Is
A React Native mobile app (Expo SDK 55) for the customer-facing side of the 7StarExperts
home services platform. Customers browse services, book providers, track bookings,
and manage their profile.

## Stack
- **Framework**: Expo SDK 55
- **React Native**: 0.83.6
- **React**: 19.2.0
- **Navigation**: expo-router v4 (file-based, like Next.js App Router)
- **Auth Storage**: expo-secure-store (JWT persisted across app restarts)
- **HTTP**: Native `fetch` API (New Architecture — no Axios needed)
- **Images**: expo-image (better performance than React Native Image)
- **Icons**: @expo/vector-icons — Ionicons
- **Architecture**: New Architecture mandatory (Legacy completely removed in SDK 55)

## IMPORTANT — Expo SDK 55 Breaking Changes
- **New Architecture is mandatory** — no `newArchEnabled` flag needed, it's always on
- **`expo-av` is removed** — use `expo-video` + `expo-audio` instead
- **`edgeToEdgeEnabled`** is mandatory on Android 16+
- **`NativeTabs`** from `expo-router/unstable-native-tabs` is experimental — avoid for production
- **React 19** — concurrent features active, avoid `useLayoutEffect` on server
- **Read versioned docs**: https://docs.expo.dev/versions/v55.0.0/

## Start the App
```bash
npm start           # starts Expo dev server (Metro bundler)
# Then press:
# i → iOS Simulator
# a → Android Emulator
```

## API Connection
File: `src/lib/config.ts`

```typescript
// iOS Simulator  → http://localhost:5001/api      ✅ works
// Android Emulator → http://10.0.2.2:5001/api     ✅ handled automatically
// Physical Device  → edit DEV_IP to your Mac's local IP
```

**Android uses `10.0.2.2`** — this is a special Android emulator alias for `localhost` on the host machine.
`localhost` inside the emulator refers to the emulator itself (no server there).

The backend must be running before starting the app:
```bash
cd ../7starexperts-backend && npm run dev
```

## OTP in Dev Mode
OTP is printed in the **backend terminal** — no SMS is sent:
```
📱 OTP for 6300908637: 123456
```

## Phone Number Format
Enter **10 digits only** — no `+91`, no spaces: `6300908637`
The app sends the raw number; backend adds `+91` when calling Twilio.

## Auth Flow
1. User enters 10-digit phone → `POST /auth/send-otp`
2. OTP appears in backend terminal
3. User enters 6-digit OTP → `POST /auth/verify-otp` with `role: 'CUSTOMER'`
4. Response: `data.tokens.accessToken` + `data.user` (note: **tokens** is nested)
5. Token saved to `expo-secure-store` key `auth_token`
6. On app restart → loads token → calls `GET /auth/me` → hydrates user
7. On 401 → clears token → redirects to login

## Navigation Structure (expo-router)
```
app/
  index.tsx              # Redirects to /(auth)/login
  _layout.tsx            # Root: AuthProvider + Stack
  (auth)/
    _layout.tsx          # Redirects to /(tabs) if already logged in
    login.tsx            # Phone input → Send OTP
    otp.tsx              # 6-digit OTP → Verify → login
  (tabs)/
    _layout.tsx          # Bottom tabs: Home | Bookings | Profile (redirects to login if no token)
    index.tsx            # Home screen
    bookings.tsx         # My bookings
    profile.tsx          # User profile
  service/
    [id].tsx             # Service detail
  booking/
    new.tsx              # Create booking (receives ?serviceId= param)
```

**Auth guard pattern:**
- `(auth)/_layout.tsx` → if `token` exists → `<Redirect href="/(tabs)" />`
- `(tabs)/_layout.tsx` → if no `token` → `<Redirect href="/(auth)/login" />`

## State Management
No Redux/Zustand — simple `useState` + `useEffect` per screen.
Global auth state via React Context: `src/context/auth-context.tsx`

```typescript
const { user, token, isLoading, login, logout, refreshUser } = useAuth();
```

## API Client (`src/lib/api.ts`)
Typed fetch wrappers — not Axios.

```typescript
import { authApi, categoriesApi, servicesApi, bookingsApi, usersApi } from '@/lib/api';

// Token is set globally after login:
import { setAuthToken } from '@/lib/api';
setAuthToken(token);  // called inside auth-context after login
```

### Response shapes
```typescript
// GET /categories → { success: true, data: Category[] }
// GET /services   → { success: true, data: Service[], pagination: {...} }
// GET /bookings   → { success: true, data: Booking[], total: number }
// GET /auth/me    → { success: true, data: User }

// POST /auth/verify-otp →
{
  success: true,
  data: {
    isNewUser: boolean,
    tokens: { accessToken: string, refreshToken: string },
    user: { id, name, phone, email, role, providerStatus }
  }
}
// ⚠️ Token is at data.tokens.accessToken — NOT data.accessToken
```

## Booking Creation
```typescript
await bookingsApi.create({
  serviceId: 'uuid',
  scheduledAt: '2026-05-30T10:00:00.000Z',   // must be in the future
  address: '123 MG Road, Bangalore',           // plain text — auto-saves as address
  notes: 'optional notes',
});
// OR use addressId (UUID of a saved address) instead of address text
```

## Cancelling a Booking
```typescript
await bookingsApi.cancel(bookingId, 'Cancelled by customer');
// Sends: PATCH /bookings/:id/status { status: 'CANCELLED', cancellationReason: '...' }
// cancellationReason is REQUIRED when status is CANCELLED
```

## Design System (`src/constants/colors.ts`)
```typescript
Colors.primary       = '#208AEF'   // brand blue
Colors.background    = '#F8F9FA'   // off-white page background
Colors.cardBackground = '#FFFFFF'  // white cards
Colors.textPrimary   = '#1A1A1A'
Colors.textSecondary = '#6B7280'
Colors.textMuted     = '#9CA3AF'
Colors.success       = '#10B981'
Colors.warning       = '#F59E0B'
Colors.error         = '#EF4444'
Colors.border        = '#E5E7EB'
```

Card shadow (iOS + Android):
```typescript
shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.08, shadowRadius: 8, elevation: 3
```

## Reusable Components

### UI Primitives (`src/components/ui/`)
- `Button` — variants: `primary | secondary | outline | danger | ghost`, sizes: `sm | md | lg`
- `Input` — with label, error, leftIcon, rightIcon
- `Badge` — status badge (PENDING=yellow, CONFIRMED=blue, COMPLETED=green, CANCELLED=red)
- `LoadingSpinner` — centered ActivityIndicator, optional `fullScreen`
- `EmptyState` — icon + title + description + optional action button

### Feature Components (`src/components/`)
- `CategoryCard` — emoji icon + name + service count (used in horizontal list)
- `ServiceCard` — image + category pill + name + duration + price
- `BookingCard` — service image + name + status badge + date + address + amount + cancel button

## TypeScript Routes
The `.expo/types/router.d.ts` file defines valid route strings for typed navigation.
After adding new screens, this file needs updating (or set `typedRoutes: false` in `app.json`).
Currently set to `false` — no need to update after adding screens.

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ERROR network request failed` | Backend not running OR wrong URL | Start backend; Android uses 10.0.2.2 auto |
| `send-otp 400 Validation failed` | Phone sent with `+91` prefix | Send 10 digits only: `6300908637` |
| `verify-otp 400 Invalid or expired OTP` | OTP already used from previous attempt | Go back, request new OTP |
| `verify-otp JSON error / undefined token` | Reading `data.accessToken` instead of `data.tokens.accessToken` | Fixed in api.ts + otp.tsx |
| `POST /bookings 403 access denied` | User role is ADMIN | Fixed: ADMIN now allowed to create bookings |
| OTP rate limit 1 hour wait | 5 OTP requests/hour limit hit | Fixed: dev mode allows 1000/hour |
| TypeScript route errors | `router.d.ts` stale after new screens | Update `.expo/types/router.d.ts` or disable typedRoutes |

## Project Structure
```
src/
  app/
    _layout.tsx           # Root: AuthProvider + Stack navigator
    index.tsx             # Redirect to (auth)/login
    (auth)/
      _layout.tsx         # Redirect to (tabs) if logged in
      login.tsx           # Phone number entry + Send OTP
      otp.tsx             # 6-box OTP entry + Verify
    (tabs)/
      _layout.tsx         # Bottom tab bar + auth guard
      index.tsx           # Home: greeting, search, categories, services
      bookings.tsx        # My bookings with status filter
      profile.tsx         # Avatar, name, menu, logout
    service/
      [id].tsx            # Service detail + Book Now button
    booking/
      new.tsx             # Date picker, time slots, address, confirm
  components/
    ui/                   # Primitive UI components
    BookingCard.tsx
    CategoryCard.tsx
    ServiceCard.tsx
  constants/
    colors.ts             # Full design system palette
  context/
    auth-context.tsx      # AuthProvider + useAuth hook
  lib/
    api.ts                # Typed fetch API client
    config.ts             # API_URL (handles iOS/Android/device)
```

## Screens Overview

### Login (`(auth)/login.tsx`)
- Blue gradient hero with star logo
- `+91` prefix + 10-digit TextInput
- Sends to backend as plain 10 digits (no +91)
- On success → navigate to `/(auth)/otp` passing phone as param

### OTP (`(auth)/otp.tsx`)
- 6 separate TextInput boxes
- Auto-advances focus to next box on each digit
- Backspace goes back to previous box
- 30-second countdown before Resend OTP
- On success → `login(token, user)` → `router.replace('/(tabs)')`

### Home (`(tabs)/index.tsx`)
- Time-aware greeting: "Good Morning/Afternoon/Evening, {firstName} 👋"
- Search bar filters services client-side
- Horizontal FlatList of CategoryCard (tap to filter services)
- 2-column grid of ServiceCard
- Promo banner
- Pull-to-refresh

### Service Detail (`service/[id].tsx`)
- Full-width hero image
- Custom back button (no header bar)
- Category pill, name, duration chip, price chip
- "What's included" list
- Price breakdown card
- Sticky "Book Now" footer button

### Booking (`booking/new.tsx`)
- Service summary card (blue bg)
- Scrollable date chips (next 14 days, starting tomorrow)
- Time slot grid (9am–6pm in 1-hour slots)
- Multi-line address textarea
- Optional notes textarea
- Price summary card
- Sticky "Confirm Booking" button (disabled until address filled)

### My Bookings (`(tabs)/bookings.tsx`)
- Filter tabs: All | Upcoming (CONFIRMED) | Completed | Cancelled
- BookingCard per booking
- Cancel button shown for PENDING and CONFIRMED bookings
- Cancel requires a reason (sent to backend)

### Profile (`(tabs)/profile.tsx`)
- Initials avatar (no photo upload)
- Edit name via bottom sheet modal
- Menu: My Bookings, Saved Addresses, Notifications, Help, Rate App, Terms
- Logout: Alert confirmation → `auth.logout()` → navigate to login
