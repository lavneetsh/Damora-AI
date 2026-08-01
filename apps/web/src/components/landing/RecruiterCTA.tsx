'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Layers } from 'lucide-react';

const actions = [
  {
    icon: ArrowRight,
    title: 'Try Demo Workspace',
    description: 'Create an account and explore with pre-loaded documents.',
    href: '/register',
    color: '#4F46E5',
    primary: true,
    external: false,
  },
  {
    icon: Github,
    title: 'Source Code',
    description: 'Browse the full monorepo — frontend, backend, and infra.',
    href: 'https://github.com/lavneetsh/Damora-AI',
    color: '#374151',
    primary: false,
    external: true,
  },
  {
    icon: Layers,
    title: 'System Architecture',
    description: 'Explore how each component connects in the live diagram.',
    href: '#architecture',
    color: '#6B7280',
    primary: false,
    external: false,
  },
];

export default function RecruiterCTA() {
  return (
    <section className="relative z-10 py-20 md:py-28 px-6 md:px-12 bg-transparent">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-xs text-slate-400 mb-3 font-mono tracking-wider uppercase">
            You&apos;re still here.
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            Let&apos;s make it worth your time.
          </h2>
          <p className="text-slate-400 max-w-sm mx-auto text-sm">
            Explore the live product, read the code, or trace the architecture.
          </p>
        </motion.div>

        {/* Action cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {actions.map(action => {
            const card = (
              <motion.div
                key={action.title}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                className={`group rounded-2xl p-6 border transition-all duration-200 cursor-pointer h-full ${
                  action.primary
                    ? 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 shadow-xl'
                    : 'bg-[#0F0F1A]/80 border-white/10 backdrop-blur-md hover:border-white/25 shadow-lg'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-200 ${
                    action.primary ? 'bg-white/20' : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <action.icon
                    className="w-5 h-5"
                    color={action.primary ? '#ffffff' : action.color}
                  />
                </div>
                <h3 className={`text-base font-semibold mb-1.5 ${action.primary ? 'text-white' : 'text-[#111827]'}`}>
                  {action.title}
                </h3>
                <p className={`text-xs leading-relaxed ${action.primary ? 'text-white/70' : 'text-[#6B7280]'}`}>
                  {action.description}
                </p>
              </motion.div>
            );

            if (action.external) {
              return <a key={action.title} href={action.href} target="_blank" rel="noopener noreferrer">{card}</a>;
            }
            if (action.href.startsWith('#')) {
              return <a key={action.title} href={action.href}>{card}</a>;
            }
            return <Link key={action.title} href={action.href as '/register'}>{card}</Link>;
          })}
        </motion.div>
      </div>
    </section>
  );
}
