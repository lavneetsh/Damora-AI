'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Brain,
  Shield,
  Zap,
  Search,
  FileText,
  Users,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Lock,
  Globe,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'RAG-Powered Answers',
    description:
      'AI responses grounded in your company\'s actual documents. No hallucinations — every answer cites its source.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Search,
    title: 'Semantic Search',
    description:
      'Find anything in your knowledge base using natural language. Vector search understands meaning, not just keywords.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Shield,
    title: 'Private by Design',
    description:
      'Your data never leaves your control. Deploy on-premises or private cloud. BYOK support for your own API keys.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Zap,
    title: 'Any LLM, Zero Lock-in',
    description:
      'Switch between Gemini, GPT-4, Claude, or any model with a single config change. Your workflows stay the same.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: FileText,
    title: 'Document Intelligence',
    description:
      'Upload PDFs, docs, spreadsheets. Automatic text extraction, chunking, and embedding into your knowledge base.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Users,
    title: 'Team Workspaces',
    description:
      'Multi-tenant architecture with RBAC. Each team gets their own knowledge base. OWNER/ADMIN/MEMBER roles.',
    color: 'from-indigo-500 to-blue-600',
  },
];

const stats = [
  { value: '< 500ms', label: 'Avg. Response Time' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '∞', label: 'Documents Indexed' },
  { value: 'BYOK', label: 'Bring Your Own Keys' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] overflow-hidden">
      {/* ─── Background Orbs ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[80px]" />
      </div>

      {/* ─── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Damora AI Logo" className="w-8 h-8 rounded-lg object-cover glow-brand" />
          <span className="text-lg font-bold tracking-tight gradient-text">
            Damora AI
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#stack" className="hover:text-white transition-colors">Stack</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-4">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-16 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-500/30 text-brand-300 text-sm font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise AI · Private by Design · Any LLM
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            A{' '}
            <span className="gradient-text">Private AI Workspace</span>
            <br />
            for Your Company
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Ground every AI response in your company&apos;s actual knowledge.
            RAG-powered chat, semantic search, and document intelligence —
            all in one secure workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary text-base py-3.5 px-8 glow-brand">
              Start Building
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-outline text-base py-3.5 px-8">
              Sign in
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f0f1a] z-10 pointer-events-none" style={{ top: '60%' }} />
          <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] glow-brand">
            {/* Mock Dashboard UI */}
            <div className="flex h-[420px]">
              {/* Sidebar */}
              <div className="w-56 bg-black/30 border-r border-white/5 p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-medium mb-4">
                  <img src="/logo.png" alt="Logo" className="w-5 h-5 rounded object-cover" />
                  Damora AI
                </div>
                {['Dashboard', 'Knowledge Base', 'Chat', 'Search', 'Settings'].map((item, i) => (
                  <div
                    key={item}
                    className={`px-3 py-2 rounded-lg text-xs ${i === 0 ? 'bg-white/8 text-white' : 'text-slate-500'}`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 overflow-hidden">
                <div className="text-sm font-semibold text-white mb-4">Knowledge Base</div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Documents', value: '247', color: 'text-brand-400' },
                    { label: 'Indexed Chunks', value: '12.4K', color: 'text-blue-400' },
                    { label: 'Chat Sessions', value: '89', color: 'text-emerald-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="glass rounded-xl p-3">
                      <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
                {/* Chat preview */}
                <div className="glass rounded-xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-400 flex-1">What does our Q3 revenue policy say about refunds?</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-300 flex-1">
                      Based on your Q3 Revenue Policy (page 12), refunds are processed within 30 days...
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 text-[9px] ml-1">
                        📄 Q3-Policy.pdf
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Stats Bar ───────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/5 py-8 mt-4">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 md:px-16 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Everything Your Team Needs
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Built for engineering teams who want production-grade AI infrastructure
            without the complexity.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="card-hover group"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}
              >
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">RAG Pipeline</h2>
          <p className="text-slate-400">
            From document upload to grounded AI answer in milliseconds.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { step: '01', title: 'Upload Documents', desc: 'PDF, DOCX, TXT — drag and drop. Status tracked in real-time.' },
            { step: '02', title: 'Extract & Chunk', desc: 'Text extracted, split into 512-token chunks with 50-token overlap.' },
            { step: '03', title: 'Embed & Index', desc: 'Gemini text-embedding-004 generates vectors. Stored in Qdrant.' },
            { step: '04', title: 'Query & Retrieve', desc: 'User question → embed → vector search → top-K chunks retrieved.' },
            { step: '05', title: 'Grounded Response', desc: 'Context-stuffed prompt → LLM → streamed answer with source citations.' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex gap-5 glass rounded-2xl p-5 border border-white/6 hover:border-brand-500/30 transition-all"
            >
              <div className="text-3xl font-black gradient-text opacity-60 w-12 flex-shrink-0">
                {item.step}
              </div>
              <div>
                <div className="font-semibold text-white">{item.title}</div>
                <div className="text-sm text-slate-400 mt-1">{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="glass rounded-3xl p-12 border border-brand-500/20 glow-brand">
          <div className="flex justify-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-brand-400" />
            <Globe className="w-5 h-5 text-blue-400" />
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Start with mock AI (no API keys needed) and upgrade to Gemini or
            GPT-4 with one environment variable change.
          </p>
          <Link href="/register" className="btn-primary text-base py-4 px-10 glow-brand inline-flex">
            Create Your Workspace
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-xs text-slate-600">
            Free to start. No credit card required.
          </p>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-slate-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.png" alt="Logo" className="w-4 h-4 rounded object-cover" />
          <span className="gradient-text font-semibold">Damora AI</span>
        </div>
        <p>Private AI Workspace for Companies</p>
      </footer>
    </div>
  );
}
