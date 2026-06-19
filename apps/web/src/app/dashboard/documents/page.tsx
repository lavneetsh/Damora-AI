'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Brain,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
} from 'lucide-react';
import { useDocumentsStore } from '@/store/documents.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { UploadZone } from '@/components/documents/UploadZone';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { PreviewModal } from '@/components/documents/PreviewModal';

// ─── Stats Summary ────────────────────────────────────────────────────────────

function KBStats({ documents }: { documents: ReturnType<typeof useDocumentsStore.getState>['documents'] }) {
  const total = documents.length;
  const ready = documents.filter((d) => d.status === 'READY').length;
  const processing = documents.filter(
    (d) => d.status === 'PENDING' || d.status === 'PROCESSING',
  ).length;
  const failed = documents.filter((d) => d.status === 'FAILED').length;
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunkCount ?? 0), 0);

  const stats = [
    { label: 'Total Documents', value: total, icon: FileText, color: 'text-slate-400' },
    { label: 'Ready', value: ready, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Processing', value: processing, icon: Clock, color: 'text-blue-400' },
    { label: 'Indexed Chunks', value: totalChunks, icon: Brain, color: 'text-brand-400' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="card py-3">
          <div className="flex items-center gap-2 mb-1">
            <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            <span className="text-xs text-slate-500">{s.label}</span>
          </div>
          <div className="text-xl font-bold text-white">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { documents, isLoading, isUploading, uploadProgress, error,
    fetchDocuments, uploadDocument, deleteDocument,
    startPolling, stopPolling } = useDocumentsStore();
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const userRole = activeWorkspace?.role;
  const canUpload = userRole === 'OWNER' || userRole === 'ADMIN';
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const hasFetched = useRef(false);

  // Avoid Next.js hydration mismatch by only rendering once client is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch documents when workspace is ready
  useEffect(() => {
    if (activeWorkspaceId && !hasFetched.current) {
      hasFetched.current = true;
      fetchDocuments(activeWorkspaceId);
    }
  }, [activeWorkspaceId, fetchDocuments]);

  // Start polling whenever we have processing documents
  useEffect(() => {
    if (!activeWorkspaceId) return;
    const hasNonTerminal = documents.some(
      (d) => d.status === 'PENDING' || d.status === 'PROCESSING',
    );
    if (hasNonTerminal) {
      startPolling(activeWorkspaceId);
    }
    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, activeWorkspaceId]);

  const handleUpload = async (file: File) => {
    if (!activeWorkspaceId) return;
    setUploadError(null);
    try {
      await uploadDocument(activeWorkspaceId, file);
      // Start polling for the new PENDING document
      startPolling(activeWorkspaceId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Upload failed. Please try again.';
      setUploadError(message);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!activeWorkspaceId) return;
    await deleteDocument(activeWorkspaceId, documentId);
  };

  const handleRefresh = () => {
    if (activeWorkspaceId) {
      hasFetched.current = false;
      fetchDocuments(activeWorkspaceId);
    }
  };

  // Render unified workspace loader while checking workspace or waiting for client mount
  if (!mounted || (!activeWorkspaceId && workspaces.length === 0 && !isLoading)) {
    return (
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
            <p className="text-slate-400 text-sm mt-1">Upload and manage your documents</p>
          </div>
        </div>
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-4" />
          <p className="text-slate-500 text-sm">{!mounted ? 'Loading...' : 'Loading workspace...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload documents to power your AI assistant
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-all border border-white/8 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {/* Stats */}
      {documents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <KBStats documents={documents} />
        </motion.div>
      )}

      {/* Upload Zone */}
      {canUpload ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Upload Document
          </h2>
          <UploadZone
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />

          {/* Upload error */}
          <AnimatePresence>
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mt-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">{uploadError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="glass rounded-2xl p-5 border border-white/6 mb-6 bg-white/2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Upload Restricted</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Your workspace role ({userRole || 'MEMBER'}) does not have permission to upload documents.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Documents ({documents.length})
          </h2>
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && documents.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 glass rounded-xl border border-white/6 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && documents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-brand-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              No documents yet
            </h3>
            <p className="text-slate-500 text-sm max-w-xs">
              Upload your first document above to start building your AI
              knowledge base. Supports PDF, DOCX, TXT, and MD.
            </p>
            <div className="flex items-center gap-2 mt-6 text-xs text-slate-600">
              <Brain className="w-3.5 h-3.5" />
              Documents are automatically chunked and indexed for semantic search
            </div>
          </motion.div>
        )}

        {/* Document Cards */}
        <AnimatePresence>
          {documents.length > 0 && (
            <motion.div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDelete={handleDelete}
                  onPreview={setPreviewDoc}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Modal Popup */}
        <AnimatePresence>
          {previewDoc && activeWorkspaceId && (
            <PreviewModal
              document={previewDoc}
              workspaceId={activeWorkspaceId}
              onClose={() => setPreviewDoc(null)}
            />
          )}
        </AnimatePresence>

        {/* Info banner when documents are processing */}
        {documents.some(
          (d) => d.status === 'PENDING' || d.status === 'PROCESSING',
        ) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center gap-3 px-4 py-3 glass rounded-xl border border-blue-500/20 bg-blue-500/5"
          >
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
            <p className="text-xs text-slate-400">
              Documents are being processed in the background. Status updates
              automatically every 3 seconds.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
