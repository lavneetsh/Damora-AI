'use client';

import { motion } from 'framer-motion';

const services = [
  {
    group: 'Frontend',
    items: [
      { name: 'Vercel', role: 'Next.js hosting, global CDN, instant preview deploys', status: 'Live' },
    ],
  },
  {
    group: 'Backend',
    items: [
      { name: 'Render', role: 'NestJS API server, auto-deploy from GitHub', status: 'Live' },
    ],
  },
  {
    group: 'Database',
    items: [
      { name: 'Neon', role: 'Serverless PostgreSQL — users, workspaces, documents', status: 'Connected' },
      { name: 'Upstash', role: 'Serverless Redis — job queues, rate limiting, caching', status: 'Active' },
    ],
  },
  {
    group: 'AI & Vector',
    items: [
      { name: 'Qdrant Cloud', role: 'Vector database — 768-dim embeddings indexed for semantic search', status: 'Indexed' },
      { name: 'Google Gemini', role: 'text-embedding-004 + gemini-2.0-flash for generation', status: 'Live' },
    ],
  },
  {
    group: 'Storage',
    items: [
      { name: 'Cloudflare R2', role: 'S3-compatible storage for uploaded documents — zero egress fees', status: 'Ready' },
    ],
  },
];

export default function LiveDeploymentStats() {
  return (
    <section className="relative z-10 py-20 md:py-28 px-6 md:px-12 bg-[#F3F2EF]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">Production</span>
            <div className="h-px flex-1 bg-[#E2E0DC]" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#111827] tracking-tight">
            Infrastructure
          </h2>
          <p className="text-[#6B7280] mt-1 text-sm">
            A distributed system, deployed across six production services.
          </p>
        </motion.div>

        {/* Service groups */}
        <div className="space-y-3">
          {services.map((group, gi) => (
            <motion.div
              key={group.group}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: gi * 0.07 }}
              className="rounded-2xl bg-white border border-[#E2E0DC] overflow-hidden"
            >
              {/* Group header */}
              <div className="px-5 py-2.5 border-b border-[#F3F2EF] bg-[#FAFAF9]">
                <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">
                  {group.group}
                </span>
              </div>

              {/* Services */}
              {group.items.map((item, ii) => (
                <div
                  key={item.name}
                  className={`flex items-center gap-4 px-5 py-3.5 ${
                    ii < group.items.length - 1 ? 'border-b border-[#F3F2EF]' : ''
                  }`}
                >
                  {/* Status dot */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-24">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-mono font-medium text-emerald-600">
                      {item.status}
                    </span>
                  </div>

                  {/* Service name */}
                  <div className="w-32 flex-shrink-0">
                    <span className="text-sm font-semibold text-[#111827]">{item.name}</span>
                  </div>

                  {/* Role */}
                  <p className="text-xs text-[#6B7280] min-w-0 flex-1 leading-relaxed">
                    {item.role}
                  </p>
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
