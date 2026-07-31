'use client';

import { useRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import Three.js components — no SSR, lazy loaded
const ThreeCanvas = dynamic(
  () => import('./AiBrainCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] md:h-[500px] flex items-center justify-center">
        <div className="text-sm text-slate-500 font-mono animate-pulse">
          Loading 3D visualization...
        </div>
      </div>
    ),
  }
);

const clusters = [
  { name: 'Finance', color: '#3b8ef8', docs: '847 vectors' },
  { name: 'HR', color: '#10b981', docs: '523 vectors' },
  { name: 'Legal', color: '#f59e0b', docs: '1.2K vectors' },
  { name: 'Engineering', color: '#6c3bfa', docs: '2.1K vectors' },
  { name: 'Sales', color: '#ec4899', docs: '634 vectors' },
];

export default function AiBrainSphere() {
  const [activeCluster, setActiveCluster] = useState<string | null>(null);

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
            <ThreeCanvas activeCluster={activeCluster} />
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
