'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Receipt,
  Users,
  Scale,
  BookOpen,
  Shield,
} from 'lucide-react';

const documentTypes = [
  { icon: FileText, label: 'Policies', color: '#6c3bfa' },
  { icon: Receipt, label: 'Invoices', color: '#3b8ef8' },
  { icon: Users, label: 'HR Documents', color: '#10b981' },
  { icon: Scale, label: 'Contracts', color: '#f59e0b' },
  { icon: BookOpen, label: 'Internal Knowledge', color: '#ec4899' },
  { icon: Shield, label: 'Compliance', color: '#8b5cf6' },
];

export default function WhySection() {
  return (
    <section id="why" className="relative z-10 py-28 md:py-36 px-6 md:px-12">
      <div className="max-w-4xl mx-auto text-center">
        {/* Opening statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-2xl md:text-4xl font-bold text-white leading-snug mb-2">
            Most AI tools know everything
          </p>
          <p className="text-2xl md:text-4xl font-bold leading-snug">
            <span className="text-slate-500">...except </span>
            <span className="bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
              your company
            </span>
            <span className="text-slate-500">.</span>
          </p>
        </motion.div>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-24 h-px bg-gradient-to-r from-transparent via-[#6c3bfa]/50 to-transparent mx-auto my-12"
        />

        {/* Document types grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.2 },
            },
          }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-14"
        >
          {documentTypes.map((doc) => (
            <motion.div
              key={doc.label}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.4 }}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 cursor-default"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-200"
                style={{ backgroundColor: `${doc.color}15` }}
              >
                <doc.icon className="w-4 h-4" style={{ color: doc.color }} />
              </div>
              <span className="text-sm text-slate-300 font-medium">
                {doc.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Closing statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="text-xl md:text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
              Damora
            </span>{' '}
            <span className="text-white">changes that.</span>
          </p>
          <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto">
            Upload your documents. Ask questions in natural language.
            Get answers grounded in your actual company knowledge — with source citations.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
