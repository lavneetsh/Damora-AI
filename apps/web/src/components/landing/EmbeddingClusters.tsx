'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface EmbeddingClustersProps {
  heroQuery: string;
  querySubmitted: boolean;
}

interface Dot {
  id: number;
  cluster: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
}

const CLUSTERS = [
  {
    name: 'Finance',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    cx: 20,
    cy: 40,
    docs: ['Q3 Revenue Report', 'Invoice Template', 'Refund Policy', 'Budget 2026'],
    keywords: ['invoice', 'refund', 'budget', 'revenue', 'finance', 'payment'],
  },
  {
    name: 'HR',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    cx: 50,
    cy: 25,
    docs: ['Remote Work Policy', 'Benefits Guide', 'Leave Policy 2026', 'Code of Conduct'],
    keywords: ['remote', 'work', 'employee', 'vacation', 'leave', 'hr', 'benefit', 'policy'],
  },
  {
    name: 'Legal',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    cx: 80,
    cy: 40,
    docs: ['Vendor Contracts', 'NDA Templates', 'Compliance 2026', 'GDPR Guidelines'],
    keywords: ['contract', 'legal', 'compliance', 'nda', 'gdpr'],
  },
  {
    name: 'Engineering',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    cx: 30,
    cy: 70,
    docs: ['API Docs v2', 'System Architecture', 'Deploy Guide', 'Runbooks'],
    keywords: ['api', 'deploy', 'system', 'engineer', 'architecture', 'technical'],
  },
  {
    name: 'Sales',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    cx: 70,
    cy: 70,
    docs: ['Pricing Sheet 2026', 'Sales Playbook', 'CRM Guide', 'Pipeline Report'],
    keywords: ['sales', 'pricing', 'crm', 'customer', 'pipeline', 'deal'],
  },
];

const DOT_COUNT = 280;

function generateDots(): Dot[] {
  const dots: Dot[] = [];
  for (let i = 0; i < DOT_COUNT; i++) {
    const cluster = Math.floor(Math.random() * CLUSTERS.length);
    const x = 5 + Math.random() * 90;
    const y = 5 + Math.random() * 90;
    dots.push({ id: i, cluster, baseX: x, baseY: y, x, y });
  }
  return dots;
}

// Determine which cluster best matches the hero query
function matchQueryToCluster(query: string): number {
  if (!query) return -1;
  const q = query.toLowerCase();
  let bestCluster = -1;
  let bestScore = 0;
  CLUSTERS.forEach((c, idx) => {
    const score = c.keywords.filter(k => q.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestCluster = idx; }
  });
  return bestScore > 0 ? bestCluster : 1; // default to HR
}

export default function EmbeddingClusters({ heroQuery, querySubmitted }: EmbeddingClustersProps) {
  const [dots] = useState<Dot[]>(() => generateDots());
  const [activeCluster, setActiveCluster] = useState<number | null>(null);
  const canvasWidth = 600;
  const canvasHeight = 400;

  // When query submitted, auto-highlight the matching cluster
  useEffect(() => {
    if (querySubmitted && heroQuery) {
      const match = matchQueryToCluster(heroQuery);
      setActiveCluster(match);
    }
  }, [querySubmitted, heroQuery]);

  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (idx: number) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setActiveCluster(idx);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveCluster(null);
    }, 120);
  };

  // Compute dot positions based on active cluster
  const computedDots = useMemo(() => {
    if (activeCluster === null) return dots;
    const cluster = CLUSTERS[activeCluster];
    const cx = (cluster.cx / 100) * canvasWidth;
    const cy = (cluster.cy / 100) * canvasHeight;

    return dots.map((dot, i) => {
      if (dot.cluster === activeCluster) {
        // Gather to cluster center with slight spread
        const angle = (i / DOT_COUNT) * Math.PI * 2;
        const spread = 20 + Math.random() * 40;
        return { ...dot, x: cx + Math.cos(angle) * spread, y: cy + Math.sin(angle) * spread };
      } else {
        // Push away from cluster center
        const dx = dot.baseX - cluster.cx;
        const dy = dot.baseY - cluster.cy;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const pushFactor = Math.min(20 / dist, 5);
        return {
          ...dot,
          x: Math.max(5, Math.min(95, dot.baseX + (dx / dist) * pushFactor)),
          y: Math.max(5, Math.min(95, dot.baseY + (dy / dist) * pushFactor)),
        };
      }
    });
  }, [dots, activeCluster]);

  return (
    <section className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">
            Semantic Memory
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg">
            Every document becomes a point in vector space.{' '}
            Hover over a cluster to see how Damora organizes your knowledge.
          </p>
          {querySubmitted && heroQuery && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-indigo-400 font-medium"
            >
              ↑ Highlighting cluster matched to your query
            </motion.p>
          )}
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-10">
          {/* SVG dot cloud */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-1 w-full rounded-2xl border border-white/15 overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E3A5F 100%)' }}
          >
            <svg
              viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
              className="w-full"
              style={{ height: 360 }}
            >
              {computedDots.map(dot => {
                const cluster = CLUSTERS[dot.cluster];
                const isActive = activeCluster === dot.cluster;
                const isDimmed = activeCluster !== null && !isActive;

                return (
                  <motion.circle
                    key={dot.id}
                    cx={(dot.x / 100) * canvasWidth}
                    cy={(dot.y / 100) * canvasHeight}
                    r={isActive ? 6 : 4.5}
                    fill={cluster.color}
                    opacity={isDimmed ? 0.2 : isActive ? 1 : 0.7}
                    animate={{
                      cx: (dot.x / 100) * canvasWidth,
                      cy: (dot.y / 100) * canvasHeight,
                      r: isActive ? 6 : 4.5,
                      opacity: isDimmed ? 0.2 : isActive ? 1 : 0.7,
                    }}
                    transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  />
                );
              })}

              {/* Cluster label in canvas */}
              {activeCluster !== null && (
                <motion.text
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={(CLUSTERS[activeCluster].cx / 100) * canvasWidth}
                  y={(CLUSTERS[activeCluster].cy / 100) * canvasHeight - 35}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#FFFFFF"
                  fontFamily="Inter, system-ui"
                >
                  {CLUSTERS[activeCluster].name}
                </motion.text>
              )}
            </svg>
          </motion.div>

          {/* Cluster buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-row flex-wrap lg:flex-col gap-3 lg:gap-4 lg:w-56"
          >
            {CLUSTERS.map((cluster, idx) => {
              const isActive = activeCluster === idx;
              return (
                <button
                  key={cluster.name}
                  onMouseEnter={() => handleMouseEnter(idx)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => setActiveCluster(isActive ? null : idx)}
                  className={`text-left px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                    isActive
                      ? 'shadow-lg scale-[1.02]'
                      : 'border-white/10 bg-[#0F0F1A]/80 backdrop-blur-md hover:border-white/25 text-white'
                  }`}
                  style={isActive ? {
                    backgroundColor: cluster.bgColor,
                    borderColor: cluster.borderColor,
                  } : {}}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cluster.color }}
                    />
                    <span className={`text-sm font-semibold ${isActive ? 'text-[#111827]' : 'text-white'}`}>{cluster.name}</span>
                  </div>

                  {/* Document list — 60fps CSS grid 0fr → 1fr transition */}
                  <div
                    className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive
                        ? 'grid-rows-[1fr] opacity-100 mt-2.5'
                        : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden space-y-1">
                      {cluster.docs.map(doc => (
                        <div key={doc} className={`text-[11px] flex items-center gap-1.5 ${isActive ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                          <span className="text-[9px]">📄</span>
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
