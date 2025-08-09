'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // This component now only wraps children without legacy auth checks
    // Authentication is handled by Clerk
  }, [router]);

  return <>{children}</>;
}