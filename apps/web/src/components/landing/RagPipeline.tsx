'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Upload,
  ScanText,
  Scissors,
  Binary,
  Database,
  Search,
  MessageSquare,
} from 'lucide-react';

const stages = [
  {
    icon: Upload,
    title: 'Upload Document',
    detail: 'PDF, DOCX, TXT — drag & drop. Stored in Cloudflare R2.',
    color: '#3b8ef8',
    techLabel: 'R2 + BullMQ',
  },
  {
    icon: ScanText,
    title: 'OCR & Text Extraction',
    detail: 'Automatic text extraction from any document format.',
    color: '#10b981',
    techLabel: 'pdf-parse',
  },
  {
    icon: Scissors,
    title: 'Intelligent Chunking',
    detail: '512-token chunks with 50-token overlap. Preserves context boundaries.',
    color: '#f59e0b',
    techLabel: '512 tokens',
  },
  {
    icon: Binary,
    title: 'Vector Embedding',
    detail: 'Each chunk → 768-dimensional vector via Gemini text-embedding-004.',
    color: '#6c3bfa',
    techLabel: 'Gemini',
  },
  {
    icon: Database,
    title: 'Vector Storage',
    detail: 'Embeddings indexed in Qdrant for sub-millisecond similarity search.',
    color: '#ec4899',
    techLabel: 'Qdrant',
  },
  {
    icon: Search,
    title: 'Semantic Search',
    detail: 'User question → embed → cosine similarity → top-K relevant chunks.',
    color: '#8b5cf6',
    techLabel: 'top-K',
  },
  {
    icon: MessageSquare,
    title: 'Grounded AI Response',
    detail: 'Context-stuffed prompt → LLM → streamed answer with source citations.',
    color: '#3b8ef8',
    techLabel: 'Streaming',
  },
];

function PipelineOrb({ inView }: { inView: boolean }) {
  return (
    <motion.div
      className="absolute left-[19px] top-0 w-3 h-3 rounded-full z-20"
      style={{
        background: 'radial-gradient(circle, #6c3bfa 0%, #3b8ef8 70%, transparent 100%)',
        boxShadow: '0 0 16px rgba(108,59,250,0.6), 0 0 32px rgba(108,59,250,0.3)',
      }}
      initial={{ top: '0%', opacity: 0 }}
      animate={
        inView
          ? {
              top: ['0%', '100%'],
              opacity: [0, 1, 1, 1, 0],
            }
          : { top: '0%', opacity: 0 }
      }
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatDelay: 2,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function RagPipeline() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-100px' });

  return (
    <section
      id="rag-pipeline"
      ref={sectionRef}
      className="relative z-10 py-24 md:py-32 px-6 md:px-12"
    >
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-white">The </span>
            <span className="bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
              RAG Pipeline
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-lg mx-auto">
            From document upload to AI-grounded answer.
            Every step engineered for accuracy.
          </p>
        </motion.div>

        {/* Pipeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[24px] top-0 bottom-0 w-px bg-gradient-to-b from-[#6c3bfa]/40 via-[#3b8ef8]/30 to-transparent" />

          {/* Traveling orb */}
          <PipelineOrb inView={isInView} />

          {/* Stages */}
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="relative flex items-start gap-5 group"
              >
                {/* Node dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className="w-[50px] h-[50px] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `${stage.color}12`,
                      border: `1px solid ${stage.color}30`,
                    }}
                  >
                    <stage.icon
                      className="w-5 h-5 transition-colors"
                      style={{ color: stage.color }}
                    />
                  </div>
                </div>

                {/* Content card */}
                <div className="flex-1 pb-4">
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-sm font-semibold text-white">
                        {stage.title}
                      </h3>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${stage.color}15`,
                          color: stage.color,
                        }}
                      >
                        {stage.techLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {stage.detail}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
