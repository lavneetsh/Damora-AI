'use client';

import { useState, useEffect } from 'react';
import BootSequence from '@/components/landing/BootSequence';
import ParticleField from '@/components/landing/ParticleField';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import WhySection from '@/components/landing/WhySection';
import RagPipeline from '@/components/landing/RagPipeline';
import AiBrainSphere from '@/components/landing/AiBrainSphere';
import ArchitectureExplorer from '@/components/landing/ArchitectureExplorer';
import StreamingChat from '@/components/landing/StreamingChat';
import PipelineVisualizer from '@/components/landing/PipelineVisualizer';
import BuiltBySection from '@/components/landing/BuiltBySection';
import RecruiterCTA from '@/components/landing/RecruiterCTA';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  const [introComplete, setIntroComplete] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if returning visitor — skip intro immediately
    if (typeof window !== 'undefined') {
      const hasVisited = localStorage.getItem('damora-boot-seen');
      if (hasVisited) {
        setIntroComplete(true);
      }
    }
  }, []);

  // Prevent flash on SSR
  if (!mounted) {
    return <div className="min-h-screen bg-[#050510]" />;
  }

  return (
    <>
      {/* Boot sequence overlay — only for first-time visitors */}
      {!introComplete && (
        <BootSequence onComplete={() => setIntroComplete(true)} />
      )}

      {/* Main landing page */}
      {introComplete && (
        <div className="min-h-screen bg-[#0f0f1a] overflow-hidden">
          <ParticleField />
          <Navbar />

          <main>
            {/* Act 1: The Problem */}
            <HeroSection />
            <WhySection />

            {/* Act 2: The Solution */}
            <RagPipeline />
            <AiBrainSphere />

            {/* Act 3: The Engineering */}
            <ArchitectureExplorer />
            <StreamingChat />
            <PipelineVisualizer />

            {/* Act 4: The Person */}
            <BuiltBySection />
            <RecruiterCTA />
          </main>

          <Footer />
        </div>
      )}
    </>
  );
}
