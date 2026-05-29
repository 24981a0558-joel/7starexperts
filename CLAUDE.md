# 7StarExperts — Admin Panel

## What This Is
A Next.js 14 admin dashboard for the 7StarExperts home services platform.
Admins manage services, categories, providers, bookings, payments, reviews, and see audit logs.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **HTTP Client**: Axios (configured in `src/lib/api.ts`)
- **Data Fetching**: TanStack React Query v5
- **Forms**: react-hook-form
- **Charts**: Recharts
- **Auth**: JWT stored in `js-cookie` as `admin_token`
- **Icons**: lucide-react

## Start the Dev Server
```bash
npm run dev    # runs on http://localhost:3000
```

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```
**Important:** Port is 5001, not 5000 (macOS AirPlay occupies 5000).

## Login Credentials
- Phone: `6300908637`
- Role must be ADMIN in the database
- OTP appears in the **backend terminal** (dev mode — no SMS)

## Pages & Routes

| Route | File | Description |
|-------|------|-------------|
| `/login` | `app/login/page.tsx` | OTP login (send → verify) |
| `/` (dashboard) | `app/page.tsx` | Stats cards + charts |
| `/bookings` | `app/bookings/page.tsx` | All bookings table + filters |
| `/providers` | `app/providers/page.tsx` | Providers list + approve/suspend |
| `/services` | `app/services/page.tsx` | Services + categories CRUD |
| `/payments` | `app/payments/page.tsx` | Payments list + refund |
| `/reviews` | `app/reviews/page.tsx` | Reviews list + delete |
| `/users` | `app/users/page.tsx` | Customer list |
| `/logs` | `app/logs/page.tsx` | Audit log (who changed what) |

## API Client (`src/lib/api.ts`)
Pre-configured Axios instance that:
- Sets `baseURL` from `NEXT_PUBLIC_API_URL`
- Attaches `Authorization: Bearer <token>` from `admin_token` cookie on every request
- On 401 → clears cookie → redirects to `/login`

```typescript
import api from '@/lib/api';
// or named exports:
import { servicesApi, bookingsApi, providersApi, logsApi } from '@/lib/api';
```

### Available API helpers
```typescript
authApi.sendOtp(phone)                      // POST /auth/send-otp
authApi.verifyOtp(phone, otp)               // POST /auth/verify-otp  { role: 'ADMIN' }
authApi.getMe()                             // GET /auth/me

dashboardApi.getStats()                     // GET /bookings/admin/stats
dashboardApi.getRevenueStats()              // GET /payments

bookingsApi.getAll(params?)                 // GET /bookings/admin/all

providersApi.getAll(params?)                // GET /providers
providersApi.getById(id)                    // GET /providers/:id
providersApi.updateStatus(id, status)       // PATCH /providers/:id/status

servicesApi.getAll(params?)                 // GET /services
servicesApi.getCategories(params?)          // GET /categories
servicesApi.createService(data)             // POST /services
servicesApi.updateService(id, data)         // PUT /services/:id
servicesApi.deleteService(id)               // DELETE /services/:id
servicesApi.createCategory(data)            // POST /categories
servicesApi.updateCategory(id, data)        // PUT /categories/:id

paymentsApi.getAll(params?)                 // GET /payments
paymentsApi.refund(bookingId, amount?)      // POST /payments/refund

reviewsApi.getAll(params?)                  // GET /reviews
reviewsApi.delete(id)                       // DELETE /reviews/:id

logsApi.getAll(params?)                     // GET /logs
```

## Layout & Auth Guard
`src/components/layout/DashboardLayout.tsx`
- Wraps all protected pages
- Reads `admin_token` cookie on client mount
- If no token → redirects to `/login`
- **Hydration fix**: returns `<LoadingScreen />` on both server AND client until `mounted=true`
  (prevents React hydration mismatch — server has no cookie, client does)

```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted || isLoading) return <LoadingScreen />;
```

## Sidebar (`src/components/layout/Sidebar.tsx`)
Nav items defined as array — add new pages here:
```typescript
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  // ...
  { href: '/logs', label: 'Audit Logs', icon: ScrollText },
];
```

## Services Page Patterns
- Pass `showAll: true` to include inactive/suspended services in the list
- Pass `showAll: true` to categories query so all categories appear in dropdowns
- `Edit` modal uses `defaultValues` from the selected service
- `Suspend/Activate` toggle calls `updateService(id, { isActive: !current })`
- Image field expects a **direct image URL** (not a webpage URL)

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Hydration mismatch on `/login` | Stars used `Math.random()` in SSR | Use deterministic seed-based array outside component |
| Hydration mismatch on dashboard | Server renders `null` (no cookie in SSR) | `mounted` state pattern — both server+client show `<LoadingScreen />` |
| `verify-otp 400` in login | `role: 'ADMIN'` was missing from Joi whitelist | Fixed: backend now accepts ADMIN role |
| All services disappear | `showAll` param not passed | Add `showAll: true` to services query |
| Category dropdown empty | `showAll` not passed to categories | Add `showAll: true` to categories query |
| CORS error | Wrong port in `.env.local` | Must be 5001 not 5000 |
| `adminOnly is not a function` | Import error in backend logs route | Use `restrictTo('ADMIN')` not `adminOnly` |

## Tailwind Theme
- Uses **v3** (v4 broke the config — downgraded)
- Custom colours defined in `tailwind.config.ts`
- Primary blue: `#208AEF`

## Data Fetching Pattern (React Query)
```typescript
const { data, isLoading, refetch } = useQuery({
  queryKey: ['services', filters],
  queryFn: () => servicesApi.getAll(filters).then(r => r.data.data),
});
```

## Form Pattern (react-hook-form)
```typescript
const { register, handleSubmit, reset, formState: { errors } } = useForm({
  defaultValues: existingItem ?? {},
});
```

## Audit Log Page (`/logs`)
- Search bar (debounced)
- Action filter: CREATE | UPDATE | DELETE | SUSPEND | ACTIVATE | APPROVE | REJECT
- Entity filter: Service | Category | Provider | User | Booking | Payment | Review
- Paginated 25/page
- Colour-coded badges per action type
- Relative timestamps

## Project Structure
```
src/
  app/
    layout.tsx          # Root layout — QueryClientProvider + fonts
    page.tsx            # Dashboard (/) 
    login/page.tsx      # OTP login
    bookings/page.tsx
    providers/page.tsx
    services/page.tsx   # Services + Categories CRUD
    payments/page.tsx
    reviews/page.tsx
    users/page.tsx
    logs/page.tsx       # Audit log
  components/
    layout/
      DashboardLayout.tsx   # Auth guard + sidebar
      Sidebar.tsx           # Nav links
    ui/                     # Shadcn-style components
  lib/
    api.ts              # Axios instance + all API helpers
```
