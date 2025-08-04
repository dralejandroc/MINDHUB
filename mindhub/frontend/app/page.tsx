'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { StorytellingSection } from '@/components/landing/StorytellingSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PlansSection } from '@/components/landing/PlansSection';
import { BetaExplanationSection } from '@/components/landing/BetaExplanationSection';
import { BetaRegistrationModal } from '@/components/landing/BetaRegistrationModal';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  const router = useRouter();
  const [showBetaModal, setShowBetaModal] = useState(false);
  
  useEffect(() => {
    // Check if user is already logged in
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        router.push('/app');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar onBetaClick={() => setShowBetaModal(true)} />
      
      <main>
        <HeroSection onBetaClick={() => setShowBetaModal(true)} />
        <StorytellingSection />
        <FeaturesSection />
        <PlansSection onBetaClick={() => setShowBetaModal(true)} />
        <BetaExplanationSection onBetaClick={() => setShowBetaModal(true)} />
      </main>

      <Footer />

      {showBetaModal && (
        <BetaRegistrationModal onClose={() => setShowBetaModal(false)} />
      )}
    </div>
  );
}