'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2,
  FileText,
  MessageSquare,
  Users,
  AlertTriangle,
  Loader2,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import apiClient from '@/lib/api-client';

interface KPIStats {
  totalDocuments: number;
  totalQuestions: number;
  activeUsers: number;
  failedQueries: number;
}

interface PopularQuery {
  query: string;
  count: number;
}

interface MissingKnowledgeItem {
  topic: string;
  count: number;
  examples: string[];
  lastAsked: string;
}

interface ReferencedDocument {
  documentId: string;
  documentName: string;
  count: number;
  lastReferencedAt: string;
}

interface AnalyticsData {
  kpis: KPIStats;
  popularQueries: PopularQuery[];
  missingKnowledge: MissingKnowledgeItem[];
  referencedDocuments: ReferencedDocument[];
}

export default function AnalyticsPage() {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const userRole = activeWorkspace?.role;
  const isAuthorized = userRole === 'OWNER' || userRole === 'ADMIN';

  // Handle client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch analytics data when workspace or role changes
  useEffect(() => {
    if (!mounted || !activeWorkspaceId || !isAuthorized) {
      setLoading(false);
      return;
    }

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<AnalyticsData>(
          `/workspaces/${activeWorkspaceId}/analytics`
        );
        setData(response.data);
      } catch (err: any) {
        console.error('Failed to load workspace analytics:', err);
        setError(
          err.response?.data?.message ||
            'Could not load analytics. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [activeWorkspaceId, isAuthorized, mounted]);

  // Handle loading states prior to client mount
  if (!mounted) {
    return (
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-brand-400" />
            Workspace Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Loading intelligence metrics...</p>
        </div>
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-4" />
          <p className="text-slate-500 text-sm">Loading workspace dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle unauthorized users (regular members)
  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center p-8 border border-red-500/10 bg-red-500/3 flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm max-w-md">
            The Admin Analytics Dashboard is restricted to workspace **Owners** and **Administrators** only.
          </p>
          <div className="mt-6 text-xs text-slate-600 bg-white/3 border border-white/5 rounded-lg px-4 py-2">
            Current Workspace Role: <span className="font-semibold text-slate-300">{userRole || 'MEMBER'}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Handle active loading state
  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-brand-400" />
            Workspace Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Analyzing workspace metrics...</p>
        </div>
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-4" />
          <p className="text-slate-500 text-sm">Analyzing logs and clustering queries...</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (error) {
    return (
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-brand-400" />
            Workspace Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage search intelligence metrics</p>
        </div>
        <div className="card text-center p-8 border border-red-500/20 bg-red-500/5">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-white mb-2">Error Loading Analytics</h3>
          <p className="text-slate-400 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalDocuments: 0,
    totalQuestions: 0,
    activeUsers: 0,
    failedQueries: 0,
  };

  const kpiItems = [
    {
      label: 'Documents Uploaded',
      value: kpis.totalDocuments,
      icon: FileText,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'Indexed in vector store',
    },
    {
      label: 'Questions Asked',
      value: kpis.totalQuestions,
      icon: MessageSquare,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      description: 'Total queries submitted',
    },
    {
      label: 'Active Users',
      value: kpis.activeUsers,
      icon: Users,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Unique member sessions',
    },
    {
      label: 'Failed Searches',
      value: kpis.failedQueries,
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: 'Queries with relevance < 0.65',
    },
  ];

  const popularQueries = (data?.popularQueries || []).slice(0, 5);
  const missingKnowledge = (data?.missingKnowledge || []).slice(0, 5);
  const referencedDocuments = (data?.referencedDocuments || []).slice(0, 5);

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-brand-400" />
          Workspace Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor search intelligence, user engagements, and address knowledge gaps in <span className="text-brand-400 font-medium">{activeWorkspace?.name}</span>.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiItems.map((kpi) => (
          <div key={kpi.label} className="card group hover:border-white/12 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="text-xs font-medium text-slate-300 mt-0.5">{kpi.label}</div>
            <div className="text-[10px] text-slate-500 mt-1">{kpi.description}</div>
          </div>
        ))}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Knowledge Gaps */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Knowledge Gaps
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Queries failing cosine similarity thresholds. AI clusters variations into unified topics.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
                  Similarity &lt; 0.65
                </span>
                <button className="text-[10px] text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  View All
                </button>
              </div>
            </div>

            {missingKnowledge.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-white/5 border-dashed rounded-xl bg-white/2">
                <HelpCircle className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">No failed queries detected in this workspace!</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Employees are successfully finding matching documents.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {missingKnowledge.map((item) => {
                  const isExpanded = expandedTopic === item.topic;
                  return (
                    <div
                      key={item.topic}
                      className={`glass rounded-xl border transition-all duration-200 ${
                        isExpanded ? 'border-amber-500/20 bg-amber-500/2' : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div
                        onClick={() => setExpandedTopic(isExpanded ? null : item.topic)}
                        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-semibold text-white truncate">
                              {item.topic}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20 flex-shrink-0">
                              {item.count} asks
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 truncate">
                            Last asked: {new Date(item.lastAsked).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-slate-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-white/5"
                          >
                            <div className="px-4 py-3 bg-white/2">
                              <div className="text-xs text-slate-400 font-semibold mb-2">
                                Query Variations Asked by Employees:
                              </div>
                              <ul className="space-y-1.5">
                                {item.examples.map((ex, idx) => (
                                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                    <span className="text-amber-500/80">•</span>
                                    <span>&ldquo;{ex}&rdquo;</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[10px] text-slate-500">
                                  💡 Upload documents matching this topic to supply this missing knowledge.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Popular Topics & Referenced Documents */}
        <div className="space-y-6">
          {/* Top Knowledge Interests */}
          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Top Knowledge Interests
              </h2>
              <button className="text-[10px] text-brand-400 hover:text-brand-300 font-medium transition-colors">
                View All
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Frequent query phrases searched in this workspace.
            </p>

            {popularQueries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 border border-white/5 border-dashed rounded-xl bg-white/2">
                <HelpCircle className="w-6 h-6 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 text-center">No search query logs yet.</p>
              </div>
            ) : (
              <div className="flex-1 space-y-2">
                {popularQueries.map((item, idx) => (
                  <div
                    key={item.query + idx}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/3 border border-white/5"
                  >
                    <span className="text-xs text-slate-300 font-semibold truncate max-w-[170px]" title={item.query}>
                      {item.query}
                    </span>
                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded font-mono">
                      {item.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Referenced Documents */}
          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Most Referenced Documents
              </h2>
              <button className="text-[10px] text-brand-400 hover:text-brand-300 font-medium transition-colors">
                View All
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Documents most frequently used to answer user questions.
            </p>

            {referencedDocuments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 border border-white/5 border-dashed rounded-xl bg-white/2">
                <HelpCircle className="w-6 h-6 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 text-center">No document reference logs yet.</p>
              </div>
            ) : (
              <div className="flex-1 space-y-3">
                {referencedDocuments.map((item, idx) => (
                  <div
                    key={item.documentId + idx}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/3 border border-white/5"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="text-xs text-slate-300 font-semibold truncate block" title={item.documentName}>
                        {item.documentName}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Last used: {new Date(item.lastReferencedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded font-mono flex-shrink-0">
                      {item.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
