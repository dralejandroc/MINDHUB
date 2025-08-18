'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { StorytellingSection } from '@/components/landing/StorytellingSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PlansSection } from '@/components/landing/PlansSection';
import { EarlyAccessExplanationSection } from '@/components/landing/EarlyAccessExplanationSection';
import { EarlyAccessRegistrationModal } from '@/components/landing/EarlyAccessRegistrationModal';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  const router = useRouter();
  const [showBetaModal, setShowBetaModal] = useState(false);
  
  useEffect(() => {
    // Check if user is already logged in via Auth
    // This will be handled automatically by Auth middleware
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar onBetaClick={() => setShowBetaModal(true)} />
      
      <main>
        <HeroSection onBetaClick={() => setShowBetaModal(true)} />
        <StorytellingSection />
        <FeaturesSection />
        <PlansSection onBetaClick={() => setShowBetaModal(true)} />
        <EarlyAccessExplanationSection onEarlyAccessClick={() => setShowBetaModal(true)} />
      </main>

      <Footer />

      {showBetaModal && (
        <EarlyAccessRegistrationModal onClose={() => setShowBetaModal(false)} />
      )}
    </div>
  );
}