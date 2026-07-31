'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Upload, CheckCircle } from 'lucide-react';

const pipelineStages = [
  {
    label: 'Uploading',
    detail: 'annual-report-2024.pdf (2.4 MB)',
    icon: '📤',
    color: '#3b8ef8',
    duration: 600,
  },
  {
    label: 'Stored in R2',
    detail: 'Cloudflare R2 object storage',
    icon: '☁️',
    color: '#f6821f',
    duration: 400,
  },
  {
    label: 'BullMQ Queued',
    detail: 'Job ID: doc-process-47f2a',
    icon: '📦',
    color: '#e8575a',
    duration: 350,
  },
  {
    label: 'OCR Processing',
    detail: 'Extracting text from 47 pages',
    icon: '📄',
    color: '#10b981',
    duration: 800,
  },
  {
    label: 'Chunking',
    detail: '124 chunks (512 tokens, 50 overlap)',
    icon: '✂️',
    color: '#f59e0b',
    duration: 500,
  },
  {
    label: 'Embedding',
    detail: '124 vectors via Gemini embedding-004',
    icon: '🧬',
    color: '#6c3bfa',
    duration: 700,
  },
  {
    label: 'Qdrant Indexed',
    detail: 'Vectors stored with metadata filters',
    icon: '🔮',
    color: '#dc4a68',
    duration: 400,
  },
  {
    label: 'Ready to Query',
    detail: 'Document fully searchable',
    icon: '✅',
    color: '#10b981',
    duration: 0,
  },
];

export default function PipelineVisualizer() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [activeStage, setActiveStage] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const hasRun = useRef(false);

  // Auto-trigger when in view
  useEffect(() => {
    if (isInView && !hasRun.current) {
      hasRun.current = true;
      setTimeout(() => startPipeline(), 600);
    }
  }, [isInView]);

  const startPipeline = () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveStage(-1);

    let delay = 0;
    pipelineStages.forEach((stage, index) => {
      delay += 300; // gap between stages
      setTimeout(() => setActiveStage(index), delay);
      delay += stage.duration;
    });

    // Done
    setTimeout(() => setIsRunning(false), delay + 500);
  };

  return (
    <section ref={sectionRef} className="relative z-10 py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-white">Live </span>
            <span className="bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
              Pipeline
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-lg mx-auto">
            Watch a document flow through the entire ingestion pipeline.
            Every stage is real engineering — not a ChatGPT wrapper.
          </p>
        </motion.div>

        {/* Pipeline container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden"
        >
          {/* File drop trigger */}
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300 font-medium">
                Document Ingestion Pipeline
              </span>
            </div>
            <button
              onClick={startPipeline}
              disabled={isRunning}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                isRunning
                  ? 'text-slate-500 bg-white/[0.03]'
                  : 'text-[#6c3bfa] bg-[#6c3bfa]/10 hover:bg-[#6c3bfa]/20'
              }`}
            >
              {isRunning ? 'Processing...' : 'Run Again'}
            </button>
          </div>

          {/* Pipeline stages */}
          <div className="p-5 md:p-6 space-y-2">
            {pipelineStages.map((stage, index) => {
              const isActive = index <= activeStage;
              const isCurrent = index === activeStage && isRunning;

              return (
                <div key={stage.label} className="flex items-center gap-4">
                  {/* Stage indicator */}
                  <div className="flex-shrink-0 w-10 flex justify-center">
                    {isActive ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        {isCurrent ? (
                          <div
                            className="w-6 h-6 rounded-full animate-pulse"
                            style={{
                              backgroundColor: `${stage.color}30`,
                              border: `2px solid ${stage.color}`,
                              boxShadow: `0 0 12px ${stage.color}50`,
                            }}
                          />
                        ) : (
                          <CheckCircle
                            className="w-5 h-5"
                            style={{ color: stage.color }}
                          />
                        )}
                      </motion.div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/[0.08] bg-white/[0.02]" />
                    )}
                  </div>

                  {/* Connector line */}
                  {index < pipelineStages.length - 1 && (
                    <div
                      className="absolute ml-[39px] mt-[28px] w-px h-3"
                      style={{
                        backgroundColor: isActive
                          ? `${stage.color}40`
                          : 'rgba(255,255,255,0.04)',
                      }}
                    />
                  )}

                  {/* Stage content */}
                  <div
                    className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? 'bg-white/[0.05] border-white/[0.1]'
                        : 'bg-white/[0.02] border-white/[0.04]'
                    }`}
                    style={
                      isCurrent
                        ? {
                            boxShadow: `0 0 20px ${stage.color}15`,
                            borderColor: `${stage.color}30`,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-base transition-opacity ${
                          isActive ? 'opacity-100' : 'opacity-30'
                        }`}
                      >
                        {stage.icon}
                      </span>
                      <div>
                        <div
                          className={`text-sm font-semibold transition-colors ${
                            isActive ? 'text-white' : 'text-slate-600'
                          }`}
                        >
                          {stage.label}
                        </div>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[11px] text-slate-400 font-mono"
                          >
                            {stage.detail}
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    {isActive && !isCurrent && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400"
                      >
                        done
                      </motion.span>
                    )}
                    {isCurrent && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${stage.color}15`,
                          color: stage.color,
                        }}
                      >
                        running
                      </motion.span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
