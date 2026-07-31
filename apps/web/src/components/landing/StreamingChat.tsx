'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Send, FileText, Bot, User } from 'lucide-react';

const USER_QUESTION =
  'What does our Q3 revenue policy say about customer refunds?';

const AI_RESPONSE =
  'Based on your Q3 Revenue Policy document (pages 12-14), customer refunds follow a tiered process:\n\n' +
  '1. **Standard Refunds** — Processed within 30 business days of the request. Requires manager approval for amounts exceeding $500.\n\n' +
  '2. **Expedited Refunds** — Available for premium-tier customers. Processed within 5 business days with automatic approval up to $2,000.\n\n' +
  '3. **Partial Refunds** — Pro-rated based on service usage. Calculated using the formula in Section 4.2 of the policy.\n\n' +
  'All refunds are logged in the finance audit trail and require documentation of the original transaction.';

const SOURCES = [
  { name: 'Q3-Revenue-Policy.pdf', page: 'Pages 12-14', relevance: '94%' },
  { name: 'Refund-Procedures-2024.docx', page: 'Section 3', relevance: '87%' },
];

export default function StreamingChat() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const [phase, setPhase] = useState<
    'idle' | 'user-typing' | 'thinking' | 'streaming' | 'sources' | 'done'
  >('idle');
  const [userChars, setUserChars] = useState(0);
  const [aiChars, setAiChars] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const hasStarted = useRef(false);

  // Start animation when in view
  useEffect(() => {
    if (isInView && !hasStarted.current) {
      hasStarted.current = true;
      setTimeout(() => setPhase('user-typing'), 800);
    }
  }, [isInView]);

  // User typing
  useEffect(() => {
    if (phase !== 'user-typing') return;
    if (userChars < USER_QUESTION.length) {
      const timer = setTimeout(
        () => setUserChars((c) => c + 1),
        30 + Math.random() * 50
      );
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setPhase('thinking'), 500);
      return () => clearTimeout(timer);
    }
  }, [phase, userChars]);

  // Thinking → streaming
  useEffect(() => {
    if (phase !== 'thinking') return;
    const timer = setTimeout(() => setPhase('streaming'), 1500);
    return () => clearTimeout(timer);
  }, [phase]);

  // AI streaming
  useEffect(() => {
    if (phase !== 'streaming') return;
    if (aiChars < AI_RESPONSE.length) {
      const timer = setTimeout(
        () => setAiChars((c) => c + 1),
        8 + Math.random() * 15
      );
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShowSources(true);
        setPhase('done');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, aiChars]);

  return (
    <section
      id="demo"
      ref={sectionRef}
      className="relative z-10 py-24 md:py-32 px-6 md:px-12"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-white">Ask </span>
            <span className="bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
              Damora
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-lg mx-auto">
            Every answer is grounded in your documents. Every claim cites its source.
            No hallucinations.
          </p>
        </motion.div>

        {/* Chat window */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          {/* Chat header */}
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-400">
              Damora AI — Knowledge Chat
            </span>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-5 min-h-[320px]">
            {/* User message */}
            {phase !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">You</div>
                  <div className="text-sm text-slate-200">
                    {USER_QUESTION.slice(0, userChars)}
                    {phase === 'user-typing' && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 bg-white/60 animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Thinking indicator */}
            {phase === 'thinking' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c3bfa] to-[#3b8ef8] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex items-center gap-1 pt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#6c3bfa]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI response */}
            {(phase === 'streaming' || phase === 'done') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c3bfa] to-[#3b8ef8] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">Damora AI</div>
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {AI_RESPONSE.slice(0, aiChars)
                      .split('**')
                      .map((part, i) =>
                        i % 2 === 1 ? (
                          <strong key={i} className="text-white font-semibold">
                            {part}
                          </strong>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    {phase === 'streaming' && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#6c3bfa] animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sources */}
            {showSources && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="ml-10 space-y-2"
              >
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Sources
                </div>
                {SOURCES.map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#6c3bfa]/10 border border-[#6c3bfa]/20"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#6c3bfa] flex-shrink-0" />
                    <span className="text-xs text-[#a29aff] font-medium">
                      {source.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {source.page}
                    </span>
                    <span className="ml-auto text-[10px] font-mono text-emerald-400">
                      {source.relevance}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Input bar */}
          <div className="px-5 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <span className="text-sm text-slate-500 flex-1">
                Ask about your documents...
              </span>
              <Send className="w-4 h-4 text-slate-600" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
