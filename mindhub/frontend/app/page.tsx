'use client';

import MainApp from '@/components/app/MainApp';
import { AuthProvider } from '@/hooks/useAuth';

export default function Home() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}