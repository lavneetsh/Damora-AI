'use client';

import { motion } from 'framer-motion';

const decisions = [
  {
    tech: 'NestJS',
    icon: '⚡',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    question: 'Why NestJS over Express?',
    reasons: [
      { label: 'Dependency Injection', desc: 'Testable, modular architecture out of the box' },
      { label: 'Built-in Validation', desc: 'class-validator + Zod eliminates manual type guards' },
      { label: 'Scalable Modules', desc: 'Clean separation as complexity grows' },
    ],
  },
  {
    tech: 'PostgreSQL',
    icon: '🐘',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    question: 'Why PostgreSQL over MongoDB?',
    reasons: [
      { label: 'Relational Integrity', desc: 'Users ↔ Workspaces ↔ Documents with ACID guarantees' },
      { label: 'Prisma ORM', desc: 'Type-safe queries with auto-generated migrations' },
      { label: 'Neon Serverless', desc: 'Connection pooling solves cold-start latency' },
    ],
  },
  {
    tech: 'Qdrant',
    icon: '🔮',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    question: 'Why Qdrant over Pinecone?',
    reasons: [
      { label: 'Filtered Search', desc: 'Restrict results to a specific workspace ID' },
      { label: 'HNSW Index', desc: 'Sub-millisecond approximate nearest neighbor search' },
      { label: 'Open Source', desc: 'Self-hostable, no vendor lock-in' },
    ],
  },
  {
    tech: 'BullMQ',
    icon: '📦',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    question: 'Why background jobs at all?',
    reasons: [
      { label: 'OCR is Slow', desc: 'PDF processing can take 5–30s — never block the API' },
      { label: 'Resilience', desc: '3× retry with exponential backoff for failed embeddings' },
      { label: 'Concurrency', desc: 'Process multiple documents in parallel without race conditions' },
    ],
  },
];

export default function EngineeringDecisions() {
  return (
    <section id="engineering" className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Engineering</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">
            Engineering Decisions
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-lg">
            Every architectural choice in Damora AI was made for production performance, resilience, and scale.
          </p>
        </motion.div>

        {/* Decisions grid — 2x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {decisions.map((d, i) => (
            <motion.div
              key={d.tech}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-[#0F0F1A]/80 backdrop-blur-md p-6 flex flex-col justify-between shadow-xl"
            >
              <div>
                {/* Badge */}
                <span
                  className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full inline-block mb-4"
                  style={{
                    backgroundColor: d.bgColor,
                    color: d.color,
                    border: `1px solid ${d.borderColor}`,
                  }}
                >
                  {d.tech}
                </span>

                {/* Question */}
                <h3 className="text-base font-bold text-white mb-4 leading-snug">
                  {d.question}
                </h3>

                {/* Reasons */}
                <div className="space-y-3">
                  {d.reasons.map((r) => (
                    <div key={r.label}>
                      <div className="text-xs font-semibold text-indigo-300 mb-0.5">{r.label}</div>
                      <div className="text-xs text-slate-400 leading-relaxed">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
