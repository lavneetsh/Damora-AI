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
  { year: '2025', label: 'Started building', detail: 'Chose the RAG stack — NestJS, Qdrant, Gemini' },
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
    <section className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-transparent">
      <div className="max-w-4xl mx-auto">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Behind Damora AI</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">
            Meet the Engineer
          </h2>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/10 bg-[#0F0F1A]/80 backdrop-blur-md p-8 md:p-10 shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Developer profile */}
            <div className="md:col-span-5 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                L
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Lavneet Sharma</h3>
                <p className="text-sm text-indigo-400 font-medium mt-0.5">Full Stack Engineer</p>
              </div>

              <blockquote className="text-sm text-slate-300 leading-relaxed border-l-2 border-indigo-500/50 pl-3 italic">
                &ldquo;One engineer. One year. One production AI platform.&rdquo;
              </blockquote>

              {/* Links */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                {links.map(l => {
                  const Icon = l.icon;
                  return (
                    <a
                      key={l.label}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs font-medium hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{l.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div className="md:col-span-7 bg-[#16162A]/60 border border-white/10 rounded-2xl p-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-4">
                Journey
              </div>

              <div className="space-y-4">
                {timeline.map(t => (
                  <div key={t.label} className="flex items-start gap-4">
                    <span className="text-xs font-mono font-bold text-indigo-400 w-10 flex-shrink-0 pt-0.5">
                      {t.year}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">{t.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{t.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stack */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">
                  Stack
                </div>
                <div className="flex flex-wrap gap-2">
                  {techStack.map(tech => (
                    <span
                      key={tech.name}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-white/10 text-slate-300 bg-white/5 cursor-default"
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                        style={{ backgroundColor: tech.color }}
                      />
                      {tech.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
