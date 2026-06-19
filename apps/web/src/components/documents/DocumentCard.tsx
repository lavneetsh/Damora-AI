'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  User,
} from 'lucide-react';
import { Document, DocumentStatus } from '@/store/documents.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import apiClient from '@/lib/api-client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('markdown')) return '📋';
  return '📃';
}

function getMimeLabel(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/msword': 'DOC',
    'text/plain': 'TXT',
    'text/markdown': 'MD',
    'text/x-markdown': 'MD',
  };
  return map[mimeType] ?? 'FILE';
}

/** Returns true if the MIME type can be previewed inline in the browser */
function isPreviewable(mimeType: string): boolean {
  return mimeType === 'application/pdf' || mimeType.startsWith('text/');
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DocumentStatus }) {
  const configs = {
    PENDING: {
      icon: <Clock className="w-3 h-3" />,
      label: 'Pending',
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    },
    PROCESSING: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: 'Processing',
      className: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    },
    READY: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: 'Ready',
      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    },
    FAILED: {
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'Failed',
      className: 'bg-red-500/15 text-red-400 border-red-500/20',
    },
  };

  const config = configs[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────

interface DocumentCardProps {
  document: Document;
  onDelete: (documentId: string) => Promise<void>;
  onPreview: (document: Document) => void;
}

export function DocumentCard({ document: doc, onDelete, onPreview }: DocumentCardProps) {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const userRole = activeWorkspace?.role;
  const canDelete = userRole === 'OWNER' || userRole === 'ADMIN';
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const isProcessing = doc.status === 'PENDING' || doc.status === 'PROCESSING';
  const isReady = doc.status === 'READY';

  // Fetches a fresh signed URL from the backend with ?download=true and triggers native download
  const handleDownload = async () => {
    if (!activeWorkspaceId || isLoadingUrl) return;
    setIsLoadingUrl(true);
    try {
      const { data } = await apiClient.get<{
        url: string;
        originalName: string;
        mimeType: string;
      }>(`/workspaces/${activeWorkspaceId}/documents/${doc.id}/download-url?download=true`);

      // Programmatic direct download
      const link = window.document.createElement('a');
      link.href = data.url;
      link.download = data.originalName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch {
      // silently ignore — the button will just return to idle state
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(doc.id);
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Uploader display name: prefer name, fall back to email initials
  const uploaderName = doc.uploadedBy?.name || doc.uploadedBy?.email || 'Unknown';
  const uploaderInitials = uploaderName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`glass rounded-xl border transition-all duration-200 ${
        doc.status === 'FAILED'
          ? 'border-red-500/20 bg-red-500/3'
          : isProcessing
          ? 'border-blue-500/15'
          : 'border-white/6 hover:border-white/12'
      }`}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        {/* File Type Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
            isReady
              ? 'bg-emerald-500/15'
              : doc.status === 'FAILED'
              ? 'bg-red-500/15'
              : 'bg-white/6'
          }`}
        >
          {getFileIcon(doc.mimeType)}
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          {/* Name + type badge */}
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-white truncate">{doc.name}</p>
            <span className="text-xs text-slate-600 font-mono flex-shrink-0">
              {getMimeLabel(doc.mimeType)}
            </span>
            {doc.extractionMethod === 'OCR' && (
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold font-mono flex-shrink-0">
                OCR
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{formatBytes(doc.sizeBytes)}</span>
            <span>·</span>
            <span>{formatDate(doc.createdAt)}</span>
            {isReady && doc.chunkCount > 0 && (
              <>
                <span>·</span>
                <span className="text-emerald-500/80">{doc.chunkCount} chunks</span>
              </>
            )}

            {/* ── Uploaded By pill ── */}
            <span>·</span>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-400"
              title={doc.uploadedBy?.email ?? doc.uploadedById}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-brand-500/40 flex items-center justify-center text-[8px] font-bold text-brand-300 flex-shrink-0">
                {uploaderInitials}
              </span>
              <User className="w-2.5 h-2.5 opacity-50 flex-shrink-0" />
              <span className="max-w-[120px] truncate">{uploaderName}</span>
            </span>
          </div>
        </div>

        {/* Status + Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={doc.status} />

          {/* Preview / Download — only when READY */}
          {isReady && !showDeleteConfirm && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPreview(doc)}
                title="Preview document"
                className="p-1.5 rounded-lg hover:bg-brand-500/15 text-slate-500 hover:text-brand-400 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                disabled={isLoadingUrl}
                title="Download file"
                className="p-1.5 rounded-lg hover:bg-emerald-500/15 text-slate-500 hover:text-emerald-400 transition-colors disabled:opacity-40"
              >
                {isLoadingUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </motion.button>
            </>
          )}

          {/* Error info toggle */}
          {doc.status === 'FAILED' && doc.errorMessage && (
            <button
              onClick={() => setShowError(!showError)}
              className="p-1.5 rounded-lg hover:bg-white/8 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showError ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {/* Delete button */}
          {canDelete && !isProcessing && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              title="Delete document"
              className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Delete confirmation */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-slate-400">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-2.5 py-1 bg-white/8 hover:bg-white/12 text-slate-400 rounded-lg text-xs font-medium transition-colors"
                >
                  No
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Processing Progress Indicator */}
      {isProcessing && (
        <div className="px-5 pb-4">
          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-blue-500 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            {doc.status === 'PENDING'
              ? 'Waiting to be processed...'
              : 'Extracting text, generating embeddings...'}
          </p>
        </div>
      )}

      {/* Error Detail */}
      <AnimatePresence>
        {showError && doc.errorMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/15 rounded-lg">
                <p className="text-xs text-red-300 font-mono break-all">{doc.errorMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
