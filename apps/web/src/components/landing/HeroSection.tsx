'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const DEMO_QUERY = 'Can employees work remotely?';

const EXAMPLE_QUERIES = [
  'vacation policy',
  'refund process',
  'invoice approval',
];

const PIPELINE_STAGES = [
  {
    id: 'search',
    label: 'Searching knowledge base...',
    sub: 'RemoteWork-Policy-2026.pdf matched',
    icon: FileText,
    duration: 700,
    techDetail: 'Cosine similarity search · Qdrant vector database',
  },
  {
    id: 'extract',
    label: 'Extracting relevant sections...',
    sub: '"Employees may work remotely up to 3 days per week..."',
    icon: FileText,
    duration: 600,
    techDetail: 'pdf-parse · OCR worker via BullMQ',
  },
  {
    id: 'split',
    label: 'Finding semantic context...',
    sub: '3 relevant chunks (87–94% similarity)',
    icon: FileText,
    duration: 650,
    techDetail: '512-token chunks · 50-token overlap · Gemini embedding-004',
  },
  {
    id: 'generate',
    label: 'Generating grounded answer...',
    sub: 'Streaming response with source citations',
    icon: Sparkles,
    duration: 800,
    techDetail: 'gemini-2.0-flash · temperature 0.2 · streaming SSE',
  },
];

const STREAMED_ANSWER =
  'According to Remote Work Policy 2026 (Page 4), employees in eligible roles may work remotely up to 3 days per week. This requires manager approval and is subject to quarterly review. Core hours of 10 AM–3 PM must be maintained regardless of location.';

const CITATION = { file: 'RemoteWork-Policy-2026.pdf', page: 'Page 4', match: '94%' };

interface HeroSectionProps {
  onQuerySubmit: (query: string) => void;
  heroQuery: string;
  setHeroQuery: (q: string) => void;
  querySubmitted: boolean;
}

export default function HeroSection({
  onQuerySubmit,
  heroQuery,
  setHeroQuery,
  querySubmitted,
}: HeroSectionProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);
  const [pipelineStage, setPipelineStage] = useState(-1);
  const [streamedText, setStreamedText] = useState('');
  const [streamDone, setStreamDone] = useState(false);
  const [citationOpen, setCitationOpen] = useState(false);
  const [hasAutoTyped, setHasAutoTyped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Auto-type demo query on mount (once)
  useEffect(() => {
    if (hasAutoTyped || querySubmitted) return;
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setInputValue(DEMO_QUERY.slice(0, i));
      if (i >= DEMO_QUERY.length) {
        clearInterval(interval);
        setIsTyping(false);
        setHasAutoTyped(true);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [hasAutoTyped, querySubmitted]);

  // Run pipeline stages when submitted
  useEffect(() => {
    if (!querySubmitted) return;
    stageTimeouts.current.forEach(clearTimeout);
    stageTimeouts.current = [];
    setPipelineStage(-1);
    setStreamedText('');
    setStreamDone(false);
    setCitationOpen(false);

    let delay = 300;
    PIPELINE_STAGES.forEach((stage, idx) => {
      const t = setTimeout(() => setPipelineStage(idx), delay);
      stageTimeouts.current.push(t);
      delay += stage.duration;
    });

    // Start streaming after pipeline completes
    const streamStart = delay + 200;
    const streamT = setTimeout(() => {
      let charIdx = 0;
      const streamInterval = setInterval(() => {
        charIdx++;
        setStreamedText(STREAMED_ANSWER.slice(0, charIdx));
        if (charIdx >= STREAMED_ANSWER.length) {
          clearInterval(streamInterval);
          setStreamDone(true);
        }
      }, 16);
      stageTimeouts.current.push(streamT);
    }, streamStart);

    return () => stageTimeouts.current.forEach(clearTimeout);
  }, [querySubmitted]);

  const handleSubmit = useCallback(() => {
    const q = inputValue.trim();
    if (!q) return;
    setHeroQuery(q);
    onQuerySubmit(q);
  }, [inputValue, onQuerySubmit, setHeroQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <section className="relative min-h-screen flex flex-col pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-5xl mx-auto w-full flex flex-col flex-1">

        {/* Headline */}
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-10 md:mb-14"
        >
          <h1
            className="font-bold tracking-tight leading-[0.95] text-white mb-4"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}
          >
            Your Company&apos;s<br />
            <span className="text-[#818CF8]">ChatGPT.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-medium mb-6">
            Built Around Your Documents.
          </p>

          {/* Problem/Solution — merged Why section */}
          <div className="flex flex-col sm:flex-row gap-4 text-sm">
            <div className="flex-1 rounded-xl border border-red-500/20 bg-red-950/30 backdrop-blur-md p-4">
              <div className="text-red-400 font-semibold mb-2 text-xs uppercase tracking-wide">
                ❌ ChatGPT doesn&apos;t know your
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-300">
                {['HR Policies', 'Contracts', 'SOPs', 'Internal Knowledge'].map(item => (
                  <span key={item} className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-950/30 backdrop-blur-md p-4">
              <div className="text-emerald-400 font-semibold mb-2 text-xs uppercase tracking-wide">
                ✓ Damora AI does.
              </div>
              <div className="text-slate-300 text-sm leading-relaxed">
                Every answer grounded in your actual documents,
                with source citations.
              </div>
            </div>
          </div>
        </motion.div>

        {/* Input + Pipeline container — the core interaction */}
        <motion.div
          layout
          className="w-full"
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Input box */}
          <AnimatePresence mode="wait">
            {!querySubmitted ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative group">
                  <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#0F0F1A]/90 border border-white/15 shadow-2xl backdrop-blur-md hover:border-indigo-500/40 transition-all duration-200 focus-within:border-indigo-500/60 focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.15)]">
                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask your company anything..."
                      className="flex-1 bg-transparent text-white text-base md:text-lg placeholder:text-slate-500 outline-none font-medium"
                      style={{ fontFamily: 'inherit' }}
                    />
                    {isTyping && (
                      <span className="w-0.5 h-5 bg-indigo-400 cursor-blink inline-block" />
                    )}
                    <button
                      onClick={handleSubmit}
                      disabled={!inputValue.trim()}
                      className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 active:scale-95 flex-shrink-0 shadow-lg"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Example queries */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-slate-400">Try:</span>
                  {EXAMPLE_QUERIES.map(q => (
                    <button
                      key={q}
                      onClick={() => { setInputValue(q); setHasAutoTyped(true); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-slate-300 bg-white/5 hover:border-indigo-500/40 hover:text-white hover:bg-indigo-500/10 transition-all duration-150"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Pipeline — grows out of the input */
              <motion.div
                key="pipeline"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="rounded-2xl bg-white border border-[#E2E0DC] shadow-lg overflow-hidden"
              >
                {/* Query header */}
                <div className="px-5 py-4 border-b border-[#F3F2EF] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-[#9CA3AF] uppercase tracking-wider mb-0.5">Query</div>
                    <div className="text-base font-semibold text-[#111827]">&ldquo;{heroQuery}&rdquo;</div>
                  </div>
                  <button
                    onClick={() => {
                      setInputValue('');
                      setHasAutoTyped(false);
                      setHeroQuery('');
                      onQuerySubmit('__reset__');
                    }}
                    className="text-xs text-[#9CA3AF] hover:text-[#4F46E5] transition-colors border border-[#E2E0DC] rounded-lg px-3 py-1.5"
                  >
                    Ask another ↑
                  </button>
                </div>

                {/* Pipeline stages */}
                <div className="p-5 space-y-3">
                  {PIPELINE_STAGES.map((stage, idx) => {
                    const active = idx <= pipelineStage;
                    const current = idx === pipelineStage && !streamDone;
                    const done = idx < pipelineStage || (idx === PIPELINE_STAGES.length - 1 && streamDone);

                    return (
                      <div
                        key={stage.id}
                        className={`flex items-start gap-3 transition-all duration-300 ${active ? 'opacity-100' : 'opacity-20'}`}
                      >
                        {/* Status dot */}
                        <div className="mt-0.5 flex-shrink-0">
                          {done ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : current ? (
                            <Loader2 className="w-5 h-5 text-[#4F46E5] animate-spin" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-[#E2E0DC]" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${active ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>
                              {stage.label}
                            </span>
                            {active && (
                              <button
                                onMouseEnter={() => setHoveredTech(stage.id)}
                                onMouseLeave={() => setHoveredTech(null)}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-[#4F46E5] border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-help"
                              >
                                how?
                              </button>
                            )}
                          </div>
                          {active && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                            >
                              <p className="text-xs text-[#6B7280] mt-0.5 font-mono truncate">{stage.sub}</p>
                              <AnimatePresence>
                                {hoveredTech === stage.id && (
                                  <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-[11px] text-[#4F46E5] mt-1 font-mono"
                                  >
                                    {stage.techDetail}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Streamed answer */}
                <AnimatePresence>
                  {streamedText && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mx-5 mb-5 rounded-xl bg-[#F8F7F4] border border-[#E2E0DC] p-4"
                    >
                      <div className="text-[10px] font-mono text-[#9CA3AF] uppercase tracking-wider mb-2">Answer</div>
                      <p className="text-sm text-[#374151] leading-relaxed">
                        {streamedText}
                        {!streamDone && (
                          <span className="inline-block w-0.5 h-4 bg-[#4F46E5] cursor-blink ml-0.5 align-middle" />
                        )}
                      </p>

                      {/* Citation */}
                      {streamDone && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="mt-3"
                        >
                          <button
                            onClick={() => setCitationOpen(o => !o)}
                            className="flex items-center gap-2 text-xs font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {CITATION.file} — {CITATION.page}
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono text-[10px]">
                              {CITATION.match}
                            </span>
                            <span className="ml-auto text-[#9CA3AF]">{citationOpen ? '▲' : '▼'}</span>
                          </button>
                          <AnimatePresence>
                            {citationOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 pl-3 border-l-2 border-[#4F46E5]/20"
                              >
                                <p className="text-xs text-[#6B7280] italic leading-relaxed">
                                  &ldquo;Employees in remote-eligible roles may work remotely up to 3 days per week,
                                  subject to quarterly review and manager approval...&rdquo;
                                </p>
                                <p className="text-[10px] text-[#9CA3AF] mt-1 font-mono">
                                  Source: RemoteWork-Policy-2026.pdf · Page 4 · Similarity: 94%
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tagline */}
        {!querySubmitted && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="mt-8 text-xs text-[#9CA3AF] text-center tracking-widest uppercase"
          >
            Designed.&nbsp;&nbsp;Built.&nbsp;&nbsp;Deployed.&nbsp;&nbsp;By One Engineer.
          </motion.p>
        )}
      </div>
    </section>
  );
}
