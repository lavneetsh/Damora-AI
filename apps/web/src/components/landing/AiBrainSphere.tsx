'use client';

import React, { useState, useEffect, Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const clusters = [
  { name: 'Finance', color: '#3b8ef8', docs: '847 vectors' },
  { name: 'HR', color: '#10b981', docs: '523 vectors' },
  { name: 'Legal', color: '#f59e0b', docs: '1.2K vectors' },
  { name: 'Engineering', color: '#6c3bfa', docs: '2.1K vectors' },
  { name: 'Sales', color: '#ec4899', docs: '634 vectors' },
];

// Fallback 2D Vector Sphere component
function Fallback2DSphere({ activeCluster }: { activeCluster: string | null }) {
  return (
    <div className="w-full h-[380px] md:h-[480px] rounded-2xl overflow-hidden bg-black/20 border border-white/[0.04] flex items-center justify-center p-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#6c3bfa]/10 via-transparent to-[#3b8ef8]/10 pointer-events-none" />

      {/* SVG Cluster representation */}
      <svg className="w-full h-full max-w-[340px] max-h-[340px]" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(108,59,250,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(59,142,248,0.15)" strokeWidth="1" strokeDasharray="3 3" />
        
        {/* Animated Nodes */}
        {clusters.map((cluster, i) => {
          const angle = (i * 2 * Math.PI) / clusters.length;
          const r = 55;
          const cx = 100 + r * Math.cos(angle);
          const cy = 100 + r * Math.sin(angle);
          const isActive = activeCluster === cluster.name;

          return (
            <g key={cluster.name}>
              <line x1="100" y1="100" x2={cx} y2={cy} stroke={isActive ? cluster.color : 'rgba(255,255,255,0.08)'} strokeWidth={isActive ? 1.5 : 0.8} />
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? 8 : 5}
                fill={cluster.color}
                opacity={isActive ? 1 : 0.7}
                className="transition-all duration-300"
              />
            </g>
          );
        })}
        {/* Core */}
        <circle cx="100" cy="100" r="12" fill="url(#coreGradient)" />
        <defs>
          <radialGradient id="coreGradient">
            <stop offset="0%" stopColor="#6c3bfa" />
            <stop offset="100%" stopColor="#3b8ef8" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

// React Error Boundary for 3D Canvas
class ThreeErrorBoundary extends Component<{ children: ReactNode; activeCluster: string | null }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; activeCluster: string | null }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('WebGL/Three.js Canvas encountered an issue, falling back to 2D vector display:', error);
  }

  render() {
    if (this.state.hasError) {
      return <Fallback2DSphere activeCluster={this.props.activeCluster} />;
    }
    return this.props.children;
  }
}

// Dynamically import Three.js components with ssr: false
const ThreeCanvas = dynamic(
  () => import('./AiBrainCanvas'),
  {
    ssr: false,
    loading: () => <Fallback2DSphere activeCluster={null} />,
  }
);

export default function AiBrainSphere() {
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="relative z-10 py-24 md:py-32 px-6 md:px-12 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-white">Inside the </span>
            <span className="bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
              AI Brain
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto">
            Every document becomes a point in high-dimensional vector space.
            Similar concepts cluster together — your AI understands meaning, not just keywords.
          </p>
        </motion.div>

        {/* 3D Sphere + Legend */}
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* 3D Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 w-full"
          >
            {isMounted ? (
              <ThreeErrorBoundary activeCluster={activeCluster}>
                <ThreeCanvas activeCluster={activeCluster} />
              </ThreeErrorBoundary>
            ) : (
              <Fallback2DSphere activeCluster={activeCluster} />
            )}
          </motion.div>

          {/* Cluster legend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-row flex-wrap lg:flex-col gap-2 lg:gap-3 lg:w-48"
          >
            {clusters.map((cluster) => (
              <button
                key={cluster.name}
                onMouseEnter={() => setActiveCluster(cluster.name)}
                onMouseLeave={() => setActiveCluster(null)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
                  activeCluster === cluster.name
                    ? 'bg-white/[0.06] border-white/[0.15]'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 transition-shadow duration-200"
                  style={{
                    backgroundColor: cluster.color,
                    boxShadow:
                      activeCluster === cluster.name
                        ? `0 0 12px ${cluster.color}80`
                        : 'none',
                  }}
                />
                <div>
                  <div className="text-xs font-semibold text-white">
                    {cluster.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {cluster.docs}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
