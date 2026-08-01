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
    <section className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-[#F8F7F4]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Engineering</span>
            <div className="h-px flex-1 bg-[#E2E0DC]" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#111827] tracking-tight mb-3">
            Decisions Made
          </h2>
          <p className="text-[#6B7280] text-base md:text-lg max-w-lg">
            Every technology was chosen deliberately. Here&apos;s the reasoning.
          </p>
        </motion.div>

        {/* Decision cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decisions.map((d, i) => (
            <motion.div
              key={d.tech}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl bg-white border border-[#E2E0DC] p-5 hover:border-[#C7C5C0] hover:shadow-sm transition-all duration-200"
            >
              {/* Tech badge */}
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                  style={{ backgroundColor: d.bgColor, border: `1px solid ${d.borderColor}` }}
                >
                  {d.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#111827]">{d.tech}</div>
                  <div className="text-[11px] text-[#9CA3AF]">{d.question}</div>
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-3">
                {d.reasons.map((r) => (
                  <div key={r.label} className="flex gap-3">
                    <span
                      className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#374151]">{r.label}</div>
                      <div className="text-[11px] text-[#6B7280] leading-relaxed">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
