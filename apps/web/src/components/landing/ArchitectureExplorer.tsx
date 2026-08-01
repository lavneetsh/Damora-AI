'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

interface ArchNode {
  id: string;
  label: string;
  icon: string;
  x: number; // % of container
  y: number;
  color: string;
  purpose: string[];
  detail?: string;
}

interface ArchEdge {
  from: string;
  to: string;
  order: number; // position in packet travel order
}

const nodes: ArchNode[] = [
  {
    id: 'nextjs',
    label: 'Next.js',
    icon: '🌐',
    x: 50, y: 5,
    color: '#4F46E5',
    purpose: [
      'Serves the UI to users',
      'Server-side renders pages',
      'Handles auth redirects',
    ],
    detail: 'React 18 · Server Components · TypeScript',
  },
  {
    id: 'nestjs',
    label: 'NestJS API',
    icon: '⚡',
    x: 50, y: 22,
    color: '#DC2626',
    purpose: [
      'Handles all business logic',
      'Validates requests with Zod',
      'Issues JWT tokens',
    ],
    detail: 'REST + Swagger · Guards · Interceptors',
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    icon: '🐘',
    x: 15, y: 42,
    color: '#2563EB',
    purpose: [
      'Stores users & workspaces',
      'Tracks document metadata',
      'Audit log & permissions',
    ],
    detail: 'Prisma ORM · Neon Serverless',
  },
  {
    id: 'redis',
    label: 'Redis',
    icon: '🔴',
    x: 50, y: 42,
    color: '#DC382D',
    purpose: [
      'Queues OCR jobs',
      'Caches repeated searches',
      'Speeds session lookups',
    ],
    detail: 'Upstash Serverless · BullMQ broker',
  },
  {
    id: 'r2',
    label: 'Cloudflare R2',
    icon: '☁️',
    x: 85, y: 42,
    color: '#D97706',
    purpose: [
      'Stores uploaded PDFs',
      'Zero egress cost',
      'Pre-signed upload URLs',
    ],
    detail: 'S3-compatible · presigned URLs',
  },
  {
    id: 'bullmq',
    label: 'BullMQ',
    icon: '📦',
    x: 50, y: 60,
    color: '#E8575A',
    purpose: [
      'Processes documents async',
      'Retries failed OCR jobs',
      'Controls concurrency',
    ],
    detail: 'Job queues · 3× retry · backoff',
  },
  {
    id: 'embed',
    label: 'Embedding',
    icon: '🧬',
    x: 50, y: 77,
    color: '#7C3AED',
    purpose: [
      'Turns text into vectors',
      'Enables semantic search',
      'Batches for efficiency',
    ],
    detail: 'Gemini text-embedding-004 · 768-dim',
  },
  {
    id: 'qdrant',
    label: 'Qdrant',
    icon: '🔮',
    x: 82, y: 77,
    color: '#DC4A68',
    purpose: [
      'Finds similar document chunks',
      'Sub-millisecond vector search',
      'Filtered by workspace',
    ],
    detail: 'HNSW index · cosine similarity',
  },
  {
    id: 'gemini',
    label: 'Gemini AI',
    icon: '✨',
    x: 50, y: 92,
    color: '#0284C7',
    purpose: [
      'Generates grounded answers',
      'Streams response tokens',
      'Context-aware reasoning',
    ],
    detail: 'gemini-2.0-flash · streaming SSE',
  },
];

// Travel order when cursor hovers nextjs
const TRAVEL_ORDER = ['nextjs', 'nestjs', 'redis', 'bullmq', 'embed', 'qdrant', 'gemini'];

const edges: ArchEdge[] = [
  { from: 'nextjs', to: 'nestjs', order: 1 },
  { from: 'nestjs', to: 'postgres', order: -1 },
  { from: 'nestjs', to: 'redis', order: 2 },
  { from: 'nestjs', to: 'r2', order: -1 },
  { from: 'redis', to: 'bullmq', order: 3 },
  { from: 'bullmq', to: 'embed', order: 4 },
  { from: 'embed', to: 'qdrant', order: 5 },
  { from: 'nestjs', to: 'gemini', order: 6 },
  { from: 'qdrant', to: 'gemini', order: 6 },
];

export default function ArchitectureExplorer() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [litNodes, setLitNodes] = useState<Set<string>>(new Set());
  const [packetPos, setPacketPos] = useState<{ x: number; y: number } | null>(null);
  const travelTimeout = useRef<NodeJS.Timeout[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false });

  const startPacket = (startNodeId: string) => {
    travelTimeout.current.forEach(clearTimeout);
    travelTimeout.current = [];
    setLitNodes(new Set());

    const startIdx = TRAVEL_ORDER.indexOf(startNodeId);
    if (startIdx === -1) return;
    const sequence = TRAVEL_ORDER.slice(startIdx);

    let delay = 0;
    sequence.forEach((nodeId, i) => {
      const node = nodes.find(n => n.id === nodeId)!;
      const t = setTimeout(() => {
        setLitNodes(prev => new Set([...prev, nodeId]));
        setPacketPos({ x: node.x, y: node.y });
        if (i === sequence.length - 1) {
          setTimeout(() => setPacketPos(null), 400);
        }
      }, delay);
      travelTimeout.current.push(t);
      delay += 400;
    });
  };

  const resetPacket = () => {
    travelTimeout.current.forEach(clearTimeout);
    setLitNodes(new Set());
    setPacketPos(null);
  };

  return (
    <section
      id="architecture"
      ref={sectionRef}
      className="relative z-10 py-24 md:py-32 px-6 md:px-12 blueprint-section"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[#111827] tracking-tight mb-3">
            System Architecture
          </h2>
          <p className="text-[#6B7280] max-w-md mx-auto text-base md:text-lg">
            Hover over any component to see what it does.
            Hover <span className="font-semibold text-[#4F46E5]">Next.js</span> to trace a request through the whole system.
          </p>
        </motion.div>

        {/* Graph — overflow:visible so edge-node tooltips aren't clipped */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-[#BFDBFE] shadow-sm"
          style={{ minHeight: 580, overflow: 'visible' }}
        >
          {/* SVG edges */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {edges.map(edge => {
              const from = nodes.find(n => n.id === edge.from)!;
              const to = nodes.find(n => n.id === edge.to)!;
              const isLit = litNodes.has(edge.from) && litNodes.has(edge.to);
              const isDimmed = hoveredNode && hoveredNode !== edge.from && hoveredNode !== edge.to;

              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={from.x} y1={from.y + 2}
                  x2={to.x} y2={to.y}
                  stroke={isLit ? '#4F46E5' : '#93C5FD'}
                  strokeWidth={isLit ? 0.5 : 0.25}
                  strokeDasharray={isLit ? 'none' : '1.5 1.5'}
                  opacity={isDimmed ? 0.2 : 1}
                  style={{ transition: 'all 0.3s ease' }}
                />
              );
            })}
          </svg>

          {/* Traveling packet */}
          {packetPos && (
            <motion.div
              className="absolute z-30 w-3 h-3 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, #fff 0%, #4F46E5 60%)',
                boxShadow: '0 0 12px #4F46E5, 0 0 24px rgba(79,70,229,0.4)',
                left: `${packetPos.x}%`,
                top: `${packetPos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              layout
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            />
          )}

          {/* Nodes */}
          {nodes.map((node, idx) => {
            const isHovered = hoveredNode === node.id;
            const isLit = litNodes.has(node.id);
            const isDimmed = hoveredNode !== null && !isHovered && !isLit;

            // Smart tooltip direction: flip based on proximity to edges
            const flipUp = node.y > 72;        // near bottom → tooltip expands UP
            const flipLeft = node.x > 68;      // near right  → tooltip anchors right
            const flipRight = node.x < 22;     // near left   → tooltip anchors left

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  zIndex: isHovered ? 50 : isLit ? 30 : 10,
                  opacity: isDimmed ? 0.3 : 1,
                }}
                onMouseEnter={() => {
                  setHoveredNode(node.id);
                  if (node.id === 'nextjs') startPacket('nextjs');
                }}
                onMouseLeave={() => {
                  setHoveredNode(null);
                  if (node.id === 'nextjs') resetPacket();
                }}
              >
                {/* Node chip */}
                <div
                  className={`rounded-2xl border px-3 py-2.5 bg-white transition-all duration-200 cursor-default whitespace-nowrap relative ${
                    isHovered
                      ? 'shadow-lg scale-105'
                      : isLit
                      ? 'shadow-sm'
                      : 'shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
                  }`}
                  style={{
                    borderColor: isHovered || isLit ? node.color : '#E2E0DC',
                    boxShadow: isHovered ? `0 4px 20px ${node.color}25` : undefined,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{node.icon}</span>
                    <span className="text-xs font-semibold text-[#111827]">{node.label}</span>
                  </div>
                </div>

                {/* Tooltip — rendered as absolutely positioned sibling so it never clips */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 min-w-[180px] bg-white rounded-2xl border shadow-xl p-3"
                      style={{
                        borderColor: node.color,
                        boxShadow: `0 8px 32px ${node.color}20, 0 2px 8px rgba(0,0,0,0.08)`,
                        // Vertical: above or below the chip
                        ...(flipUp
                          ? { bottom: 'calc(100% + 8px)', top: 'auto' }
                          : { top: 'calc(100% + 8px)', bottom: 'auto' }),
                        // Horizontal: anchor based on edge proximity
                        ...(flipLeft
                          ? { right: 0, left: 'auto' }
                          : flipRight
                          ? { left: 0, right: 'auto' }
                          : { left: '50%', transform: 'translateX(-50%)' }),
                      }}
                    >
                      <div
                        className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                        style={{ color: node.color }}
                      >
                        {node.label}
                      </div>
                      {node.purpose.map(p => (
                        <div key={p} className="flex items-start gap-1.5 mb-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0"
                            style={{ backgroundColor: node.color }}
                          />
                          <span className="text-[11px] text-[#374151] leading-snug">{p}</span>
                        </div>
                      ))}
                      {node.detail && (
                        <p className="text-[10px] font-mono text-[#9CA3AF] mt-2 pt-2 border-t border-[#F3F2EF]">
                          {node.detail}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
