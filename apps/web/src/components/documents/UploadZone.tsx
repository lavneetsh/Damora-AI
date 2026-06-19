'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, FileType, AlertCircle, X } from 'lucide-react';

const SUPPORTED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/msword': 'DOC',
  'text/plain': 'TXT',
  'text/markdown': 'MD',
  'text/x-markdown': 'MD',
};

const MAX_SIZE_MB = 25;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('markdown')) return '📋';
  return '📃';
}

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export function UploadZone({ onUpload, isUploading, uploadProgress }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!SUPPORTED_TYPES[file.type]) {
      return `Unsupported file type. Please upload PDF, DOCX, TXT, or MD files.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File is too large (${formatBytes(file.size)}). Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        setSelectedFile(null);
      } else {
        setValidationError(null);
        setSelectedFile(file);
      }
    },
    [validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      // Error is handled by the store
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !selectedFile && !isUploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-brand-400 bg-brand-500/10'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-500/5 cursor-default'
            : 'border-white/10 hover:border-brand-500/50 hover:bg-white/3'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.txt,.md"
          onChange={handleInputChange}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-brand-400 animate-bounce" />
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-1">
                  Uploading {selectedFile?.name}...
                </p>
                <p className="text-xs text-slate-500">{uploadProgress}% complete</p>
              </div>
              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto h-1.5 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          ) : selectedFile ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-2xl">
                {getFileIcon(selectedFile.type)}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {SUPPORTED_TYPES[selectedFile.type]} · {formatBytes(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="p-1.5 rounded-lg hover:bg-white/8 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Drop a file here, or{' '}
                  <span className="text-brand-400">browse</span>
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  PDF, DOCX, TXT, MD · Max {MAX_SIZE_MB} MB
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 mt-2">
                {['PDF', 'DOCX', 'TXT', 'MD'].map((type) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 bg-white/5 rounded text-xs text-slate-500 font-mono"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Validation Error */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">{validationError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      <AnimatePresence>
        {selectedFile && !isUploading && (
          <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={handleUpload}
            className="btn-primary w-full text-sm py-3"
          >
            <FileText className="w-4 h-4" />
            Upload &ldquo;{selectedFile.name}&rdquo;
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
