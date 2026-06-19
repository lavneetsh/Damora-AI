'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  BookOpen,
  Loader2,
  Sparkles,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import apiClient from '@/lib/api-client';

interface SearchResult {
  documentId: string;
  documentName: string;
  pageNumber: number;
  chunkIndex: number;
  snippet: string;
  score: number;
}

const SCORE_COLOR = (score: number) => {
  if (score >= 0.85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (score >= 0.65) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
};

const SCORE_LABEL = (score: number) => {
  if (score >= 0.85) return 'High Match';
  if (score >= 0.65) return 'Good Match';
  return 'Partial Match';
};

export default function SearchPage() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !activeWorkspaceId) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const { data } = await apiClient.get<SearchResult[]>(
        `/workspaces/${activeWorkspaceId}/documents/search`,
        { params: { q: query.trim(), limit: 10 } },
      );
      setResults(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Search failed. Make sure documents have been uploaded and processed.',
      );
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, activeWorkspaceId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white">Semantic Search</h1>
        <p className="text-slate-400 text-sm mt-1">
          Search understands <span className="text-brand-400 font-medium">meaning</span>, not just
          keywords — powered by vector embeddings across your knowledge base.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative mb-8"
      >
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-slate-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ask anything… e.g. "What are the leave policies?" or "Remote work guidelines"'
          className="w-full pl-12 pr-24 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
        />

        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {query && (
            <button
              onClick={clearSearch}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-all flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </motion.div>

      {/* Results Area */}
      <AnimatePresence mode="wait">
        {/* Loading shimmer */}
        {isSearching && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-2 bg-white/5 rounded w-1/5" />
                  </div>
                  <div className="h-5 w-20 bg-white/10 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-white/5 rounded w-full" />
                  <div className="h-2 bg-white/5 rounded w-5/6" />
                  <div className="h-2 bg-white/5 rounded w-4/6" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Error State */}
        {!isSearching && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card border-red-500/20 bg-red-500/5 flex items-start gap-4 p-6"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Search Failed</p>
              <p className="text-xs text-slate-400 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Empty Results State */}
        {!isSearching && !error && hasSearched && results.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-300 font-medium">No results found</p>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">
              No document chunks matched "<span className="text-slate-400">{query}</span>". Try
              rephrasing your search or upload more documents.
            </p>
          </motion.div>
        )}

        {/* Initial Placeholder (before any search) */}
        {!isSearching && !error && !hasSearched && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ask Your Documents Anything</h3>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Type a natural language question above. Gemini embeddings will find the most
              semantically relevant passages across all your uploaded files — instantly.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                'What are the leave policies?',
                'Overtime pay rules',
                'Remote work guidelines',
                'Medical benefits',
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setQuery(hint)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-slate-400 hover:text-slate-200 transition-all"
                >
                  {hint}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results List */}
        {!isSearching && !error && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Result Count Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">
                <span className="text-white font-semibold">{results.length}</span> result
                {results.length !== 1 ? 's' : ''} for{' '}
                <span className="text-brand-400">"{query}"</span>
              </p>
              <button
                onClick={clearSearch}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            </div>

            {/* Result Cards */}
            <div className="space-y-4">
              {results.map((result, idx) => (
                <motion.div
                  key={`${result.documentId}-${result.chunkIndex}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card group hover:border-brand-500/30 hover:bg-white/5 transition-all cursor-default"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-brand-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {result.documentName}
                        </p>
                        {/* Citation: Page number badge */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <BookOpen className="w-3 h-3" />
                            Page {result.pageNumber}
                          </span>
                          <span className="text-slate-700">·</span>
                          <span className="text-xs text-slate-500">
                            Chunk #{result.chunkIndex + 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Similarity Score Badge */}
                    <div
                      className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${SCORE_COLOR(result.score)}`}
                    >
                      <span>{Math.round(result.score * 100)}% match</span>
                      <span className="hidden sm:inline opacity-60">— {SCORE_LABEL(result.score)}</span>
                    </div>
                  </div>

                  {/* Snippet Text */}
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-4 group-hover:text-slate-300 transition-colors">
                    {result.snippet}
                  </p>

                  {/* Footer: Citation bar */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span className="text-xs text-slate-600">
                      Source:{' '}
                      <span className="text-slate-400 font-medium">{result.documentName}</span>
                      {' · '}
                      <span className="text-slate-500">Page {result.pageNumber}</span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
