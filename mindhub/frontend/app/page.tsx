'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroScrollSection } from '@/components/landing/HeroScrollSection';
import { AnimatedStatsSection } from '@/components/landing/AnimatedStatsSection';
import { BentoFeaturesSection } from '@/components/landing/BentoFeaturesSection';
import { StorytellingSection } from '@/components/landing/StorytellingSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PlansSection } from '@/components/landing/PlansSection';
import { EarlyAccessExplanationSection } from '@/components/landing/EarlyAccessExplanationSection';
import { EarlyAccessRegistrationModal } from '@/components/landing/EarlyAccessRegistrationModal';
import { MindHubFooter } from '@/components/ui/footer';

export default function LandingPage() {
  const router = useRouter();
  const [showBetaModal, setShowBetaModal] = useState(false);
  
  useEffect(() => {
    // Check if user is already logged in via Auth
    // This will be handled automatically by Auth middleware
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <LandingNavbar onBetaClick={() => setShowBetaModal(true)} />
      
      <main>
        <HeroScrollSection onBetaClick={() => setShowBetaModal(true)} />
        <AnimatedStatsSection />
        <BentoFeaturesSection />
        <StorytellingSection />
        <PlansSection onBetaClick={() => setShowBetaModal(true)} />
        <EarlyAccessExplanationSection onEarlyAccessClick={() => setShowBetaModal(true)} />
      </main>
      
      <MindHubFooter variant="full" />

      {showBetaModal && (
        <EarlyAccessRegistrationModal onClose={() => setShowBetaModal(false)} />
      )}
    </div>
  );
}