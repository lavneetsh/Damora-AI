'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  Search,
  TrendingUp,
  ArrowRight,
  Upload,
  Sparkles,
  Brain,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useDocumentsStore } from '@/store/documents.store';
import apiClient from '@/lib/api-client';

const quickActions = [
  {
    icon: Upload,
    label: 'Upload Document',
    description: 'Add files to your knowledge base',
    href: '/dashboard/documents',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: MessageSquare,
    label: 'Start Chat',
    description: 'Ask AI about your documents',
    href: '/dashboard/chat',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Search,
    label: 'Semantic Search',
    description: 'Find anything in your knowledge base',
    href: '/dashboard/search',
    color: 'from-emerald-500 to-teal-600',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const { documents, fetchDocuments } = useDocumentsStore();
  const [greeting, setGreeting] = useState('Welcome ');
  const [aiProvider, setAiProvider] = useState<string>('mock');

  useEffect(() => {
    async function getSystemConfig() {
      try {
        const { data } = await apiClient.get<{ aiProvider: string; embeddingProvider: string }>('/auth/config');
        setAiProvider(data.aiProvider);
      } catch (err) {
        console.error('Failed to load system config:', err);
      }
    }
    getSystemConfig();
  }, []);

  useEffect(() => {
    const isNew = sessionStorage.getItem('just_registered');
    const firstName = user?.name?.split(' ')[0] ?? 'there';
    if (isNew === 'true') {
      setGreeting(`Welcome, ${firstName} `);
      sessionStorage.removeItem('just_registered');
    } else {
      setGreeting(`Welcome back, ${firstName} `);
    }
  }, [user]);

  // Load documents for active workspace to compute statistics
  useEffect(() => {
    if (activeWorkspaceId) {
      fetchDocuments(activeWorkspaceId);
    }
  }, [activeWorkspaceId, fetchDocuments]);

  // Compute dynamic stats from store data
  const readyDocsCount = documents.filter((d) => d.status === 'READY').length;
  const totalChunks = documents.reduce((sum, d) => sum + (d.chunkCount ?? 0), 0);

  const stats = [
    {
      label: 'Documents',
      value: String(documents.length),
      icon: FileText,
      change: documents.length === 0 ? 'Upload your first doc' : `${readyDocsCount} ready to use`,
    },
    {
      label: 'Chat Sessions',
      value: '0',
      icon: MessageSquare,
      change: 'Start a conversation',
    },
    {
      label: 'Knowledge Chunks',
      value: String(totalChunks),
      icon: Brain,
      change: documents.length === 0 ? 'Awaiting documents' : 'Embedded & indexed',
    },
    {
      label: 'Searches',
      value: '0',
      icon: TrendingUp,
      change: 'Try semantic search',
    },
  ];

  // Getting started steps with dynamic completion status
  const steps = [
    {
      step: 1,
      title: 'Upload your first document',
      done: documents.length > 0,
      href: '/dashboard/documents',
    },
    {
      step: 2,
      title: 'Wait for processing (embeddings + indexing)',
      done: readyDocsCount > 0,
      href: null,
    },
    {
      step: 3,
      title: 'Ask AI a question about your documents',
      done: false,
      href: '/dashboard/chat',
    },
    {
      step: 4,
      title: 'Try semantic search across your knowledge base',
      done: false,
      href: '/dashboard/search',
    },
  ];

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {greeting}
        </h1>
        <p className="text-slate-400 mt-1">
          Your AI workspace is ready. Start by uploading documents to your knowledge base.
        </p>
      </motion.div>

      {/* AI Status Banner */}
      {aiProvider === 'mock' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5 mb-8 flex items-center gap-4"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">Running in Mock Mode</p>
            <p className="text-xs text-slate-400 mt-0.5">
              AI responses are simulated. Add <code className="px-1 py-0.5 bg-white/8 rounded text-amber-300">GEMINI_API_KEY</code> to{' '}
              <code className="px-1 py-0.5 bg-white/8 rounded text-slate-300">apps/api/.env</code> and set{' '}
              <code className="px-1 py-0.5 bg-white/8 rounded text-slate-300">AI_PROVIDER=gemini</code> to enable real AI.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5 mb-8 flex items-center gap-4"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-400">Google Gemini Active</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time RAG pipeline is online. AI responses are generated using <span className="font-semibold text-emerald-400">gemini-3.1-flash-lite</span> and grounded in your knowledge base documents using <span className="font-semibold text-emerald-400">text-embedding-004</span>.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="card group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-brand-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs font-medium text-slate-300 mt-0.5">{stat.label}</div>
            <div className="text-xs text-slate-600 mt-1">{stat.change}</div>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href as '/dashboard/documents' | '/dashboard/chat' | '/dashboard/search'}
              className="card-hover group flex items-center gap-4"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
              >
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{action.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{action.description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Getting Started
        </h2>
        <div className="glass rounded-2xl border border-white/6 overflow-hidden">
          {steps.map((item, i) => (
            <div
              key={item.step}
              className={`flex items-center gap-4 px-6 py-4 ${i < 3 ? 'border-b border-white/5' : ''
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.done
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/8 text-slate-500'
                  }`}
              >
                {item.done ? '✓' : item.step}
              </div>
              <span
                className={`text-sm flex-1 ${item.done ? 'line-through text-slate-600' : 'text-slate-300'}`}
              >
                {item.title}
              </span>
              {item.href && !item.done && (
                <Link
                  href={item.href as '/dashboard/documents' | '/dashboard/chat' | '/dashboard/search'}
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                >
                  Go <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
