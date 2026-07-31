'use client';

import { motion } from 'framer-motion';
import { Github, Linkedin, FileText } from 'lucide-react';

const techStack = [
  { name: 'Next.js', color: '#ffffff' },
  { name: 'NestJS', color: '#e0234e' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'PostgreSQL', color: '#336791' },
  { name: 'Redis', color: '#dc382d' },
  { name: 'Qdrant', color: '#dc4a68' },
  { name: 'Gemini AI', color: '#4285f4' },
  { name: 'Prisma', color: '#2d3748' },
  { name: 'BullMQ', color: '#e8575a' },
  { name: 'Cloudflare R2', color: '#f6821f' },
  { name: 'Docker', color: '#2496ed' },
  { name: 'Three.js', color: '#049ef4' },
];

const links = [
  {
    icon: Github,
    label: 'GitHub',
    href: 'https://github.com/lavneetsh/Damora-AI',
    color: '#ffffff',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/lavneetsh',
    color: '#0077b5',
  },
  {
    icon: FileText,
    label: 'Resume',
    href: 'https://drive.google.com/file/d/19n8tX8DkYA7ejr3ney7WM2HAsuJm20NI/view?usp=drivesdk',
    color: '#6c3bfa',
  },
];

export default function BuiltBySection() {
  return (
    <section className="relative z-10 py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-3xl mx-auto text-center">
        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-16 h-px bg-gradient-to-r from-transparent via-[#6c3bfa]/40 to-transparent mx-auto mb-14"
        />

        {/* Built by */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm text-slate-500 mb-2 uppercase tracking-widest font-medium">
            Designed & Engineered by
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Lavneet Sharma
          </h2>
          <p className="text-base text-slate-400 mb-8">
            Full Stack Engineer · Building production-grade AI systems
          </p>
        </motion.div>

        {/* Tech stack badges */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.04, delayChildren: 0.2 },
            },
          }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {techStack.map((tech) => (
            <motion.span
              key={tech.name}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1 },
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200 cursor-default"
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                style={{ backgroundColor: tech.color }}
              />
              {tech.name}
            </motion.span>
          ))}
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-center gap-3"
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-200"
              style={{ color: link.color }}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
