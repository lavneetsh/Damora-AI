'use client';

import { motion } from 'framer-motion';
import { Github, Linkedin, FileText } from 'lucide-react';

const techStack = [
  { name: 'Next.js 14', color: '#374151' },
  { name: 'NestJS', color: '#DC2626' },
  { name: 'TypeScript', color: '#2563EB' },
  { name: 'PostgreSQL', color: '#336791' },
  { name: 'Redis', color: '#dc382d' },
  { name: 'Qdrant', color: '#7C3AED' },
  { name: 'Gemini AI', color: '#0284C7' },
  { name: 'Prisma', color: '#374151' },
  { name: 'BullMQ', color: '#D97706' },
  { name: 'Cloudflare R2', color: '#D97706' },
  { name: 'Docker', color: '#2496ed' },
  { name: 'GitHub Actions', color: '#374151' },
];

const timeline = [
  { year: '2024', label: 'Started building', detail: 'Chose the RAG stack — NestJS, Qdrant, Gemini' },
  { year: '→', label: 'Full Stack Development', detail: 'Auth, uploads, document processing, chat' },
  { year: '→', label: 'Production Deployment', detail: 'Render, Vercel, Neon, Upstash, R2, Qdrant Cloud' },
  { year: 'Now', label: 'Enterprise AI Focus', detail: 'Distributed systems · Background jobs · AI pipelines' },
];

const links = [
  {
    icon: Github,
    label: 'GitHub',
    href: 'https://github.com/lavneetsh/Damora-AI',
    color: '#374151',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/lavneetsh',
    color: '#0077B5',
  },
  {
    icon: FileText,
    label: 'Resume',
    href: 'https://drive.google.com/file/d/19n8tX8DkYA7ejr3ney7WM2HAsuJm20NI/view?usp=drivesdk',
    color: '#4F46E5',
  },
];

export default function BuiltBySection() {
  return (
    <section className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-[#F3F2EF]">
      <div className="max-w-4xl mx-auto">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">
              Behind Damora AI
            </span>
            <div className="h-px flex-1 bg-[#E2E0DC]" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Identity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white text-2xl font-bold mb-5">
              L
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] tracking-tight leading-tight mb-2">
              Lavneet Sharma
            </h2>
            <p className="text-base text-[#6B7280] mb-1">Full Stack Engineer</p>

            {/* One-line statement */}
            <p className="text-base md:text-lg font-medium text-[#374151] leading-relaxed mt-4 mb-6 border-l-4 border-[#4F46E5] pl-4">
              One engineer.&nbsp; One year.&nbsp; One production AI platform.
            </p>

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              {links.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[#E2E0DC] bg-white hover:border-[#C7C5C0] hover:shadow-sm transition-all duration-150"
                  style={{ color: link.color }}
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Right: Timeline + Tech */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Timeline */}
            <div className="rounded-2xl bg-white border border-[#E2E0DC] p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF] mb-4">
                Journey
              </div>
              <div className="space-y-4">
                {timeline.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-[#4F46E5]">{item.year}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#111827]">{item.label}</div>
                      <div className="text-xs text-[#6B7280]">{item.detail}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tech stack */}
            <div className="rounded-2xl bg-white border border-[#E2E0DC] p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF] mb-3">
                Stack
              </div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
                }}
                className="flex flex-wrap gap-2"
              >
                {techStack.map(tech => (
                  <motion.span
                    key={tech.name}
                    variants={{
                      hidden: { opacity: 0, y: 6, scale: 0.9 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#E2E0DC] text-[#374151] hover:border-[#C7C5C0] hover:bg-[#F8F7F4] transition-all duration-150 cursor-default"
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                      style={{ backgroundColor: tech.color }}
                    />
                    {tech.name}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
