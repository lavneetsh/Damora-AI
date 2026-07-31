'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Layers } from 'lucide-react';

const actions = [
  {
    icon: ArrowRight,
    title: 'Launch Workspace',
    description: 'Create an account and start building your knowledge base.',
    href: '/register',
    color: '#6c3bfa',
    primary: true,
    external: false,
  },
  {
    icon: Layers,
    title: 'View Architecture',
    description: 'Explore the full system design and API documentation.',
    href: '#architecture',
    color: '#3b8ef8',
    primary: false,
    external: false,
  },
  {
    icon: Github,
    title: 'Source Code',
    description: 'Browse the full monorepo — frontend, backend, and infra.',
    href: 'https://github.com/lavneetsh/Damora-AI',
    color: '#ffffff',
    primary: false,
    external: true,
  },
];

export default function RecruiterCTA() {
  return (
    <section className="relative z-10 py-20 md:py-28 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm text-slate-500 mb-3 font-mono">
            You&apos;re still here.
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Let&apos;s make it worth your time.
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Explore the live product, read the code, or dive into the architecture.
          </p>
        </motion.div>

        {/* Action cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.2 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {actions.map((action) => {
            const CardContent = (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className={`group rounded-2xl p-6 border transition-all duration-300 cursor-pointer h-full ${
                  action.primary
                    ? 'bg-gradient-to-br from-[#6c3bfa]/20 to-[#3b8ef8]/10 border-[#6c3bfa]/30 hover:border-[#6c3bfa]/50 hover:shadow-[0_0_30px_rgba(108,59,250,0.2)]'
                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-200"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">
                  {action.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {action.description}
                </p>
              </motion.div>
            );

            if (action.external) {
              return (
                <a
                  key={action.title}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {CardContent}
                </a>
              );
            }

            if (action.href.startsWith('#')) {
              return (
                <a key={action.title} href={action.href}>
                  {CardContent}
                </a>
              );
            }

            return (
              <Link key={action.title} href={action.href as '/register'}>
                {CardContent}
              </Link>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
