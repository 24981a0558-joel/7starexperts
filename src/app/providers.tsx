// 📘 React Query's QueryClientProvider must be a Client Component.
// We isolate it here so the root layout (Server Component) can import it safely.

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  // useState ensures each user session gets a fresh QueryClient
  // (important for SSR — prevents data sharing between users)
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,      // data is fresh for 1 minute before re-fetching
          retry: 1,                  // retry failed requests once
          refetchOnWindowFocus: false, // don't refetch when user switches tabs
        },
      },
    })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
