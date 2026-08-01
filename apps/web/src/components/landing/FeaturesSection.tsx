'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Users,
  ShieldCheck,
  BarChart3,
  Key,
  Upload,
  Search,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

interface Feature {
  id: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  badge?: string;
}

const features: Feature[] = [
  {
    id: 'workspace',
    icon: Layers,
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    label: 'Core',
    title: 'Multi-Workspace',
    description: 'Create isolated workspaces for different teams or clients — each with its own document knowledge base.',
    bullets: [
      'Fully isolated document sets per workspace',
      'Switch workspaces without re-authenticating',
      'Each workspace has independent settings',
    ],
    badge: 'Foundation',
  },
  {
    id: 'sharing',
    icon: Users,
    color: '#0891B2',
    bgColor: '#ECFEFF',
    borderColor: '#A5F3FC',
    label: 'Collaboration',
    title: 'Team Sharing',
    description: 'Invite colleagues to your workspace with a single click. Everyone gets instant access to shared knowledge.',
    bullets: [
      'Email invite with secure token',
      'One workspace, many team members',
      'Real-time access — no re-indexing needed',
    ],
  },
  {
    id: 'rbac',
    icon: ShieldCheck,
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    label: 'Access Control',
    title: 'Role-Based Permissions',
    description: 'Three-tier security model (Owner 👑, Admin 🛡️, Employee 👤) ensures privacy and exact access control.',
    bullets: [
      '👑 Owner — full control, billing, delete workspace',
      '🛡️ Admin — manage members, upload documents',
      '👤 Employee — query only, read-only access',
    ],
    badge: 'Enterprise',
  },
  {
    id: 'docs',
    icon: Upload,
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    label: 'Processing',
    title: 'Document Ingestion',
    description: 'Upload PDFs and documents. Damora automatically extracts, chunks, embeds, and indexes in seconds.',
    bullets: [
      'PDF, DOCX, TXT — auto-detected',
      'Background OCR via BullMQ workers',
      'Progress tracking with retry on failure',
    ],
  },
  {
    id: 'search',
    icon: Search,
    color: '#0284C7',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    label: 'Retrieval',
    title: 'Semantic Search',
    description: 'Meaning-based vector search. Find relevant information even when exact keywords don\'t match.',
    bullets: [
      'Returns top-k semantically similar chunks',
      'Cosine similarity scoring (0–100%)',
      'Filtered by workspace for privacy',
    ],
  },
  {
    id: 'chat',
    icon: MessageSquare,
    color: '#DB2777',
    bgColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    label: 'Interface',
    title: 'AI Chat Interface',
    description: 'A familiar ChatGPT-like interface — grounded in your actual documents with verified source citations.',
    bullets: [
      'Streaming response, character by character',
      'Click any citation to see the source excerpt',
      'Persistent chat history per workspace',
    ],
  },
  {
    id: 'analytics',
    icon: BarChart3,
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    label: 'Insights',
    title: 'Analytics Dashboard',
    description: 'Track query volume, response latency, most-accessed documents, and member activity in real time.',
    bullets: [
      'Query volume and latency over time',
      'Most-accessed documents and chunks',
      'Per-member usage breakdown',
    ],
  },
  {
    id: 'byok',
    icon: Key,
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    label: 'BYOK',
    title: 'Bring Your Own Key',
    description: 'Connect your own Gemini API key. Full cost control, data privacy, and zero shared rate limits.',
    bullets: [
      'Connect your own Google AI API key',
      'Encrypted at rest with AES-256',
      'No vendor lock-in on AI spend',
    ],
    badge: 'Enterprise',
  },
];

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  return (
    <section id="features" className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">
              What You Can Build
            </span>
            <div className="h-px flex-1 bg-[#E2E0DC]" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">
            Everything You Need
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-lg">
            Damora AI is a complete enterprise knowledge platform —
            not just a chat wrapper. Click any feature to learn more.
          </p>
        </motion.div>

        {/* Bento grid — perfectly balanced 4x2 grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start"
        >
          {features.map((feat) => {
            const Icon = feat.icon;
            const isActive = activeFeature === feat.id;

            return (
              <motion.div
                key={feat.id}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                className="col-span-1 self-start"
              >
                <button
                  onClick={() => setActiveFeature(isActive ? null : feat.id)}
                  className="w-full text-left block"
                >
                  <div
                    className={`rounded-2xl border p-5 transition-all duration-300 cursor-pointer bg-[#0F0F1A]/80 backdrop-blur-md flex flex-col justify-between ${
                      isActive
                        ? 'shadow-xl scale-[1.01]'
                        : 'hover:shadow-md border-white/10 hover:border-white/25'
                    }`}
                    style={{
                      borderColor: isActive ? feat.color : 'rgba(255,255,255,0.12)',
                      boxShadow: isActive ? `0 4px 24px ${feat.color}25` : undefined,
                      minHeight: 220,
                    }}
                  >
                    <div>
                      {/* Icon + badge row */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: feat.bgColor, border: `1px solid ${feat.borderColor}` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: feat.color }} />
                        </div>
                        <div className="flex items-center gap-2">
                          {feat.badge && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: feat.bgColor,
                                color: feat.color,
                                border: `1px solid ${feat.borderColor}`,
                              }}
                            >
                              {feat.badge}
                            </span>
                          )}
                          <ChevronRight
                            className="w-4 h-4 text-slate-400 transition-transform duration-300"
                            style={{ transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)' }}
                          />
                        </div>
                      </div>

                      {/* Label */}
                      <div
                        className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                        style={{ color: feat.color }}
                      >
                        {feat.label}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-white mb-2">{feat.title}</h3>

                      {/* Description */}
                      <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{feat.description}</p>
                    </div>

                    {/* Expandable bullets — CSS grid 0fr → 1fr transition for 60fps hardware-accelerated expansion */}
                    <div
                      className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isActive
                          ? 'grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-white/10'
                          : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0 border-transparent pointer-events-none'
                      }`}
                    >
                      <div className="overflow-hidden space-y-2">
                        {feat.bullets.map(bullet => (
                          <div key={bullet} className="flex items-start gap-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                              style={{ backgroundColor: feat.color }}
                            />
                            <span className="text-[11px] text-slate-300 leading-snug">{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
