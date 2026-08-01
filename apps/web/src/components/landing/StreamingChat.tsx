'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

const ANSWER_FOR_QUERY: Record<string, {
  question: string;
  answer: string;
  source: string;
  page: string;
  excerpt: string;
  match: string;
}> = {
  default: {
    question: 'Can employees work remotely?',
    answer:
      'According to Remote Work Policy 2026 (Page 4), employees in eligible roles may work remotely up to 3 days per week. Core hours of 10 AM–3 PM must be maintained. This is subject to quarterly review and manager approval.',
    source: 'RemoteWork-Policy-2026.pdf',
    page: 'Page 4',
    excerpt: '"Employees in remote-eligible roles may work remotely for a maximum of three (3) days per week, provided core hours (10:00 AM–3:00 PM local time) are maintained..."',
    match: '94%',
  },
  vacation: {
    question: 'What is the vacation policy?',
    answer:
      'According to HR Policy 2026 (Section 5.2), full-time employees receive 15 days of paid vacation annually. Vacation days accumulate monthly and can carry over up to 5 days to the following year.',
    source: 'HR-Policy-2026.pdf',
    page: 'Section 5.2',
    excerpt: '"Full-time employees shall accrue 1.25 vacation days per month (15 days/year). A maximum of 5 days may be carried forward into the subsequent calendar year..."',
    match: '91%',
  },
  refund: {
    question: 'How does the refund process work?',
    answer:
      'According to Refund Policy v3 (Page 12), standard refunds are processed within 30 business days. Amounts exceeding $500 require manager approval. Premium-tier customers qualify for 5-day expedited processing.',
    source: 'Refund-Policy-v3.pdf',
    page: 'Page 12',
    excerpt: '"Standard refund requests shall be processed within thirty (30) business days. Requests exceeding $500.00 USD require written manager authorisation..."',
    match: '89%',
  },
  invoice: {
    question: 'What is the invoice approval flow?',
    answer:
      'According to Finance SOP 2026 (Section 3), all invoices above $1,000 require dual approval from Finance and the requesting department head. Automated approval is granted for recurring vendors below threshold.',
    source: 'Finance-SOP-2026.pdf',
    page: 'Section 3',
    excerpt: '"Invoices exceeding one thousand dollars ($1,000.00) shall require counter-signature from both the Finance Controller and the originating department head..."',
    match: '92%',
  },
};

function resolveContent(query: string) {
  const q = query.toLowerCase();
  if (q.includes('vacation') || q.includes('leave') || q.includes('annual')) return ANSWER_FOR_QUERY.vacation;
  if (q.includes('refund') || q.includes('return')) return ANSWER_FOR_QUERY.refund;
  if (q.includes('invoice') || q.includes('approval') || q.includes('finance')) return ANSWER_FOR_QUERY.invoice;
  return ANSWER_FOR_QUERY.default;
}

interface StreamingChatProps {
  heroQuery: string;
  querySubmitted: boolean;
}

export default function StreamingChat({ heroQuery, querySubmitted }: StreamingChatProps) {
  const content = resolveContent(heroQuery || '');
  const [streamedText, setStreamedText] = useState('');
  const [streamDone, setStreamDone] = useState(false);
  const [citationOpen, setCitationOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(chatRef, { once: true, margin: '-80px' });

  // Trigger streaming when section first enters view
  useEffect(() => {
    if (isInView && !hasStarted) setHasStarted(true);
  }, [isInView, hasStarted]);

  // Reset and re-stream when query changes or on scroll-into-view for first time
  useEffect(() => {
    if (!hasStarted) return;
    setStreamedText('');
    setStreamDone(false);
    setCitationOpen(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setStreamedText(content.answer.slice(0, i));
      if (i >= content.answer.length) {
        clearInterval(interval);
        setStreamDone(true);
      }
    }, 14);
    return () => clearInterval(interval);
  }, [content.answer, hasStarted]);

  return (
    <section id="demo" className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-transparent">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">
            Ask Damora
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto">
            Every answer is grounded in your documents — no hallucination, always cited.
          </p>
          {querySubmitted && heroQuery && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-indigo-400 font-medium"
            >
              Showing answer for: &ldquo;{heroQuery}&rdquo;
            </motion.p>
          )}
        </motion.div>

        {/* Chat window */}
        <motion.div
          ref={chatRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl bg-white border border-[#E2E0DC] shadow-sm overflow-hidden"
        >
          {/* Chat header */}
          <div className="px-5 py-3 border-b border-[#F3F2EF] flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-[#6B7280]">Damora AI — Knowledge Chat</span>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-5 min-h-[280px]">
            {/* User question */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#F3F2EF] border border-[#E2E0DC] flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#374151]">
                L
              </div>
              <div>
                <div className="text-[10px] text-[#9CA3AF] mb-1 font-medium">You</div>
                <div className="text-sm text-[#111827] font-medium">{content.question}</div>
              </div>
            </div>

            {/* AI response */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#4F46E5] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white">
                D
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-[#9CA3AF] mb-1 font-medium">Damora AI</div>
                <div className="text-sm text-[#374151] leading-relaxed">
                  {streamedText}
                  {!streamDone && streamedText && (
                    <span className="inline-block w-0.5 h-4 bg-[#4F46E5] cursor-blink ml-0.5 align-middle" />
                  )}
                  {!streamedText && (
                    <span className="text-[#9CA3AF] italic">Generating response...</span>
                  )}
                </div>

                {/* Citation */}
                {streamDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3"
                  >
                    <button
                      onClick={() => setCitationOpen(o => !o)}
                      className="flex items-center gap-2 text-xs font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors group"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{content.source}</span>
                      <span className="text-[#9CA3AF]">— {content.page}</span>
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] border border-emerald-100">
                        {content.match}
                      </span>
                      {citationOpen ? (
                        <ChevronUp className="w-3 h-3 ml-auto text-[#9CA3AF]" />
                      ) : (
                        <ChevronDown className="w-3 h-3 ml-auto text-[#9CA3AF]" />
                      )}
                    </button>

                    <AnimatePresence>
                      {citationOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2.5 pl-3 border-l-2 border-[#4F46E5]/20 rounded-r-lg"
                        >
                          <p className="text-xs text-[#6B7280] italic leading-relaxed">
                            {content.excerpt}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-mono text-[#9CA3AF]">
                              {content.source} · {content.page}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">
                              {content.match} relevance
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="px-5 py-3 border-t border-[#F3F2EF]">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#F8F7F4] border border-[#E2E0DC]">
              <span className="text-sm text-[#9CA3AF] flex-1">Ask about your documents...</span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">⏎ Enter</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
