'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pt-24 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="text-center max-w-4xl mx-auto"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] text-[#a29aff] text-xs md:text-sm font-medium mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Enterprise RAG · Private by Design · Any LLM
        </motion.div>

        {/* Main heading — problem-focused */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
          <span className="text-white">Your Company&apos;s </span>
          <span className="bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
            ChatGPT
          </span>
          <br />
          <span className="text-slate-300 text-[0.85em]">
            Built Around{' '}
            <span className="text-white">Your</span> Documents.
          </span>
        </h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Ground every AI response in your company&apos;s actual knowledge.
          Not the public internet. Not someone else&apos;s data.
          <span className="text-slate-300"> RAG-powered search, chat, and document intelligence</span> —
          all in one private workspace.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] rounded-2xl px-8 py-4 hover:shadow-[0_0_30px_rgba(108,59,250,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Launch Workspace
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#why"
            className="inline-flex items-center gap-2 text-base font-medium text-[#a29aff] border border-[#6c3bfa]/30 hover:border-[#6c3bfa]/60 rounded-2xl px-6 py-3.5 hover:bg-[#6c3bfa]/10 transition-all duration-200"
          >
            See How It Works
            <ChevronDown className="w-4 h-4" />
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5 text-slate-500" />
        </motion.div>
      </motion.div>
    </section>
  );
}
