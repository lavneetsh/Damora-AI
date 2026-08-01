'use client';

import { useState, useCallback } from 'react';
import SystemBackground from '@/components/landing/SystemBackground';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import EmbeddingClusters from '@/components/landing/EmbeddingClusters';
import ArchitectureExplorer from '@/components/landing/ArchitectureExplorer';
import StreamingChat from '@/components/landing/StreamingChat';
import FeaturesSection from '@/components/landing/FeaturesSection';
import LiveDeploymentStats from '@/components/landing/LiveDeploymentStats';
import EngineeringDecisions from '@/components/landing/EngineeringDecisions';
import BuiltBySection from '@/components/landing/BuiltBySection';
import RecruiterCTA from '@/components/landing/RecruiterCTA';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  const [heroQuery, setHeroQuery] = useState('');
  const [querySubmitted, setQuerySubmitted] = useState(false);

  const handleQuerySubmit = useCallback((query: string) => {
    if (query === '__reset__') {
      setHeroQuery('');
      setQuerySubmitted(false);
      return;
    }
    setHeroQuery(query);
    setQuerySubmitted(true);
  }, []);

  return (
    <div className="landing-root min-h-screen relative">
      <SystemBackground heroQuery={heroQuery} querySubmitted={querySubmitted} />
      <Navbar />

      {/*
       * The landing page tells one continuous story:
       *
       * Act 1 — The Question (Hero)
       * Act 2 — The Journey (Pipeline inline in hero → Clusters → Architecture)
       * Act 3 — The Answer (Streaming Chat → Deployment Proof)
       * Act 4 — The Engineer (Decisions → Behind Damora AI → CTA)
       */}

      {/* Act 1: The Question */}
      <HeroSection
        onQuerySubmit={handleQuerySubmit}
        heroQuery={heroQuery}
        setHeroQuery={setHeroQuery}
        querySubmitted={querySubmitted}
      />

      {/* Act 2: The Journey */}
      <EmbeddingClusters heroQuery={heroQuery} querySubmitted={querySubmitted} />
      <ArchitectureExplorer />

      {/* Act 3: The Answer */}
      <StreamingChat heroQuery={heroQuery} querySubmitted={querySubmitted} />
      <FeaturesSection />
      <LiveDeploymentStats />

      {/* Act 4: The Engineer */}
      <EngineeringDecisions />
      <BuiltBySection />
      <RecruiterCTA />

      <Footer />
    </div>
  );
}
