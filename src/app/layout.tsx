// ─────────────────────────────────────────────────────────────────────────────
// ROOT LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
// 📘 In Next.js App Router, layout.tsx wraps EVERY page under its directory.
// The root layout (src/app/layout.tsx) wraps the ENTIRE app.
//
// We use it to:
//   1. Set global HTML metadata (title, description)
//   2. Load global CSS
//   3. Wrap everything in React Query provider
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: '7StarExperts Admin',
  description: 'Admin Panel for 7StarExperts platform',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/*
          📘 Providers wraps the app in React Query's QueryClientProvider.
          React Query needs this context to work — any component inside can
          call useQuery() and it will use the shared QueryClient.
          We put it in a separate file because layout.tsx is a Server Component
          and QueryClientProvider is a Client Component ('use client').
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
