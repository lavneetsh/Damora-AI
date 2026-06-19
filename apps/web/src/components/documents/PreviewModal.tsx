'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Document } from '@/store/documents.store';
import apiClient from '@/lib/api-client';

interface PreviewModalProps {
  document: Document;
  workspaceId: string;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PreviewModal({ document: doc, workspaceId, onClose }: PreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPdf = doc.mimeType === 'application/pdf';
  const isText = doc.mimeType.startsWith('text/') || 
                 doc.mimeType === 'application/json' || 
                 doc.mimeType.includes('markdown');

  // Load the pre-signed URL on mount
  useEffect(() => {
    let active = true;

    async function loadUrl() {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get<{
          url: string;
          originalName: string;
          mimeType: string;
        }>(`/workspaces/${workspaceId}/documents/${doc.id}/download-url`);

        if (!active) return;
        setSignedUrl(data.url);

        // For text files, fetch the contents to show inline
        if (isText) {
          try {
            const res = await fetch(data.url);
            if (!res.ok) throw new Error('Failed to fetch text content');
            const txt = await res.text();
            if (active) setTextContent(txt);
          } catch (err) {
            console.error('Failed to load text preview content:', err);
            if (active) setTextContent('Unable to load text contents. You can still download the file to view it.');
          }
        }
      } catch (err) {
        console.error('Failed to get download URL:', err);
        if (active) setError('Failed to generate preview URL. Please try again.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadUrl();

    return () => {
      active = false;
    };
  }, [doc.id, workspaceId, isText]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    if (!signedUrl) return;
    const link = window.document.createElement('a');
    link.href = signedUrl;
    link.download = doc.originalName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative w-full max-w-5xl h-[85vh] bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden glass"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-white/3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-xl flex-shrink-0 border border-brand-500/10">
              <FileText className="w-5 h-5 text-brand-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate" title={doc.name}>
                {doc.name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{formatBytes(doc.sizeBytes)}</span>
                <span>·</span>
                <span className="uppercase">{doc.mimeType.split('/').pop()}</span>
                {doc.pageCount && (
                  <>
                    <span>·</span>
                    <span>{doc.pageCount} pages</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {signedUrl && (
              <>
                {/* Download */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-lg shadow-brand-500/15 transition-all border border-brand-400/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </motion.button>

                {/* Open in New Tab fallback */}
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-slate-400 hover:text-white transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </motion.a>
              </>
            )}

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-slate-400 hover:text-white transition-colors ml-2"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 min-h-0 bg-slate-950/20 p-6 flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="text-sm text-slate-400">Loading document preview...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-center max-w-sm">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h4 className="text-sm font-semibold text-white">Preview Failed</h4>
              <p className="text-xs text-slate-400">{error}</p>
              {signedUrl && (
                <button
                  onClick={handleDownload}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs border border-white/8"
                >
                  <Download className="w-3 h-3" /> Download instead
                </button>
              )}
            </div>
          ) : isPdf && signedUrl ? (
            // Native PDF frame embed
            <iframe
              src={`${signedUrl}#toolbar=0`}
              className="w-full h-full rounded-xl border border-white/6 bg-slate-900/50 shadow-inner"
              title="PDF Preview"
            />
          ) : isText && textContent !== null ? (
            // Text rendering
            <div className="w-full h-full rounded-xl border border-white/6 bg-slate-950/45 p-5 overflow-auto font-mono text-xs text-slate-300 select-text whitespace-pre-wrap shadow-inner leading-relaxed">
              {textContent}
            </div>
          ) : (
            // Unsupported type fallback (e.g. DOCX)
            <div className="flex flex-col items-center gap-4 text-center max-w-md p-8 glass rounded-2xl border border-white/8 bg-white/2">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/10 text-3xl mb-2">
                🗂️
              </div>
              <h4 className="text-base font-semibold text-white">No Inline Preview Available</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Word files (DOCX/DOC) and other advanced binary formats cannot be displayed directly in the browser. 
                Please download the file to view it locally on your machine.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all border border-brand-400/20"
              >
                <Download className="w-3.5 h-3.5" />
                Download Document
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
