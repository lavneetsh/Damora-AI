'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface ArchNode {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  color: string;
  details: string[];
}

interface ArchConnection {
  from: string;
  to: string;
}

const nodes: ArchNode[] = [
  {
    id: 'browser',
    label: 'Next.js',
    icon: '🌐',
    x: 50,
    y: 5,
    color: '#3b8ef8',
    details: ['Server Components', 'React 18', 'Framer Motion', 'Zustand State'],
  },
  {
    id: 'api',
    label: 'NestJS API',
    icon: '⚡',
    x: 50,
    y: 20,
    color: '#e63946',
    details: ['REST + Swagger', 'JWT Auth', 'Global Exception Filter', 'Request Timing'],
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    icon: '🐘',
    x: 15,
    y: 38,
    color: '#336791',
    details: ['Prisma ORM', 'Neon Serverless', 'Migrations', 'Multi-tenant'],
  },
  {
    id: 'redis',
    label: 'Redis',
    icon: '🔴',
    x: 50,
    y: 38,
    color: '#dc382d',
    details: ['Upstash Serverless', 'Job Queues', 'Rate Limiting', 'Dead Letter Queue'],
  },
  {
    id: 'r2',
    label: 'Cloudflare R2',
    icon: '☁️',
    x: 85,
    y: 38,
    color: '#f6821f',
    details: ['S3-Compatible', 'File Storage', 'Zero Egress Fees', 'Presigned URLs'],
  },
  {
    id: 'bullmq',
    label: 'BullMQ',
    icon: '📦',
    x: 50,
    y: 55,
    color: '#e8575a',
    details: ['Job Queues', 'Retries (3x)', 'Backoff Strategy', 'Concurrency Control'],
  },
  {
    id: 'ocr',
    label: 'OCR Worker',
    icon: '📄',
    x: 20,
    y: 70,
    color: '#10b981',
    details: ['pdf-parse', 'Text Extraction', 'Encoding Detection', 'Error Recovery'],
  },
  {
    id: 'embed',
    label: 'Embedding',
    icon: '🧬',
    x: 50,
    y: 70,
    color: '#6c3bfa',
    details: ['Gemini text-embedding-004', '768 Dimensions', 'Batch Processing', 'Chunking'],
  },
  {
    id: 'qdrant',
    label: 'Qdrant',
    icon: '🔮',
    x: 80,
    y: 70,
    color: '#dc4a68',
    details: ['Vector Database', 'HNSW Index', 'Cosine Similarity', 'Filtered Search'],
  },
  {
    id: 'gemini',
    label: 'Gemini AI',
    icon: '✨',
    x: 50,
    y: 88,
    color: '#4285f4',
    details: ['gemini-2.0-flash', 'Streaming SSE', 'Context Window', 'Temperature Control'],
  },
];

const connections: ArchConnection[] = [
  { from: 'browser', to: 'api' },
  { from: 'api', to: 'postgres' },
  { from: 'api', to: 'redis' },
  { from: 'api', to: 'r2' },
  { from: 'redis', to: 'bullmq' },
  { from: 'bullmq', to: 'ocr' },
  { from: 'bullmq', to: 'embed' },
  { from: 'embed', to: 'qdrant' },
  { from: 'api', to: 'gemini' },
  { from: 'qdrant', to: 'gemini' },
];

// Animated data packet that travels through the architecture
function DataPacket({ inView }: { inView: boolean }) {
  // Follow the main request path: browser → api → redis → bullmq → embed → qdrant → gemini
  const path = [
    { x: 50, y: 5 },
    { x: 50, y: 20 },
    { x: 50, y: 38 },
    { x: 50, y: 55 },
    { x: 50, y: 70 },
    { x: 80, y: 70 },
    { x: 50, y: 88 },
  ];

  const xValues = path.map((p) => `${p.x}%`);
  const yValues = path.map((p) => `${p.y}%`);

  if (!inView) return null;

  return (
    <motion.div
      className="absolute w-3 h-3 rounded-full z-30 pointer-events-none"
      style={{
        background: 'radial-gradient(circle, #fff 0%, #6c3bfa 50%, transparent 100%)',
        boxShadow: '0 0 16px #6c3bfa, 0 0 32px rgba(108,59,250,0.4)',
      }}
      animate={{
        left: xValues,
        top: yValues,
        opacity: [0, 1, 1, 1, 1, 1, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatDelay: 3,
        ease: 'easeInOut',
        times: [0, 0.05, 0.2, 0.4, 0.6, 0.85, 1],
      }}
    />
  );
}

export default function ArchitectureExplorer() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-100px' });

  return (
    <section
      id="architecture"
      ref={sectionRef}
      className="relative z-10 py-24 md:py-32 px-6 md:px-12"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-white">System </span>
            <span className="bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
              Architecture
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-lg mx-auto">
            Not a monolith. A distributed, event-driven system built for scale.
            Hover over any component to explore.
          </p>
        </motion.div>

        {/* Architecture graph */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full min-h-[500px] md:min-h-[560px]"
        >
          {/* SVG connections */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {connections.map((conn) => {
              const from = nodes.find((n) => n.id === conn.from)!;
              const to = nodes.find((n) => n.id === conn.to)!;
              const isHighlighted =
                hoveredNode === conn.from || hoveredNode === conn.to;

              return (
                <line
                  key={`${conn.from}-${conn.to}`}
                  x1={from.x}
                  y1={from.y + 2}
                  x2={to.x}
                  y2={to.y}
                  stroke={isHighlighted ? '#6c3bfa' : 'rgba(108,59,250,0.15)'}
                  strokeWidth={isHighlighted ? 0.4 : 0.2}
                  strokeDasharray={isHighlighted ? 'none' : '1 1'}
                  style={{
                    transition: 'all 0.3s ease',
                    filter: isHighlighted ? 'drop-shadow(0 0 2px #6c3bfa)' : 'none',
                  }}
                />
              );
            })}
          </svg>

          {/* Data packet */}
          <DataPacket inView={isInView} />

          {/* Nodes */}
          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div
                className={`relative rounded-2xl p-3 border transition-all duration-300 cursor-default ${
                  hoveredNode === node.id
                    ? 'bg-white/[0.08] border-white/[0.15] scale-110'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
                }`}
                style={{
                  boxShadow:
                    hoveredNode === node.id
                      ? `0 0 24px ${node.color}30, 0 0 48px ${node.color}15`
                      : 'none',
                }}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-base">{node.icon}</span>
                  <span className="text-xs font-semibold text-white">
                    {node.label}
                  </span>
                </div>

                {/* Expanded details on hover */}
                {hoveredNode === node.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 pt-2 border-t border-white/[0.08] space-y-1"
                  >
                    {node.details.map((detail) => (
                      <div
                        key={detail}
                        className="text-[10px] text-slate-400 flex items-center gap-1.5"
                      >
                        <span
                          className="w-1 h-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: node.color }}
                        />
                        {detail}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
