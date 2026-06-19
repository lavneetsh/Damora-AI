'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Brain,
  Sparkles,
  Loader2,
  Info,
  Compass,
  Lock,
  Globe,
  Share2,
  EyeOff,
  Users,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useChatStore, ChatSession } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';

// ─── Helpers ────────────────────────────────────────────────────────────────

function VisibilityBadge({ visibility }: { visibility: 'PRIVATE' | 'SHARED' }) {
  if (visibility === 'SHARED') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/20">
        <Users className="w-2.5 h-2.5" />
        Shared
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-500/15 text-slate-500 border border-slate-500/20">
      <Lock className="w-2.5 h-2.5" />
      Private
    </span>
  );
}

function SidebarSection({
  label,
  icon: Icon,
  children,
  count,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <Icon className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          {label}
        </span>
        {count > 0 && (
          <span className="ml-auto text-[9px] bg-white/5 text-slate-500 px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {count === 0 ? (
        <p className="text-center text-slate-600 text-[10px] py-3 px-3">
          No {label.toLowerCase()} yet
        </p>
      ) : (
        children
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ChatPage() {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const { user } = useAuthStore();
  const {
    privateSessions,
    sharedSessions,
    currentSessionId,
    messages,
    isStreaming,
    streamingText,
    isLoading,
    error,
    fetchPrivateSessions,
    fetchSharedSessions,
    createSession,
    fetchSessionMessages,
    deleteSession,
    shareSession,
    unshareSession,
    sendMessage,
    setCurrentSessionId,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentUserRole = activeWorkspace?.role ?? 'MEMBER';

  // Find the active session from either list
  const activeSession: ChatSession | undefined =
    privateSessions.find((s) => s.id === currentSessionId) ??
    sharedSessions.find((s) => s.id === currentSessionId);

  const isCurrentSessionOwner = activeSession?.userId === user?.id;
  const canShareOthers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canShare = isCurrentSessionOwner || canShareOthers;
  const isSharedSession = activeSession?.visibility === 'SHARED';
  // Non-owners viewing a shared session see it in read-only mode
  const isReadOnly = isSharedSession && !isCurrentSessionOwner;

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isStreaming]);

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchPrivateSessions(activeWorkspaceId);
      fetchSharedSessions(activeWorkspaceId);
    }
  }, [activeWorkspaceId, fetchPrivateSessions, fetchSharedSessions]);

  useEffect(() => {
    if (activeWorkspaceId && currentSessionId) {
      fetchSessionMessages(activeWorkspaceId, currentSessionId);
    }
  }, [activeWorkspaceId, currentSessionId, fetchSessionMessages]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateSession = async () => {
    if (!activeWorkspaceId) return;
    try {
      const title = `Discussion ${privateSessions.length + sharedSessions.length + 1}`;
      await createSession(activeWorkspaceId, title);
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeWorkspaceId || !currentSessionId || isStreaming || isReadOnly) return;
    const userQuery = input.trim();
    setInput('');
    await sendMessage(activeWorkspaceId, currentSessionId, userQuery);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeWorkspaceId) return;
    try {
      await deleteSession(activeWorkspaceId, sessionId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleShare = async (sessionId: string) => {
    if (!activeWorkspaceId) return;
    setSharingId(sessionId);
    try {
      await shareSession(activeWorkspaceId, sessionId);
    } catch (err) {
      console.error('Failed to share session:', err);
    } finally {
      setSharingId(null);
    }
  };

  const handleUnshare = async (sessionId: string) => {
    if (!activeWorkspaceId) return;
    setSharingId(sessionId);
    try {
      await unshareSession(activeWorkspaceId, sessionId);
    } catch (err) {
      console.error('Failed to unshare session:', err);
    } finally {
      setSharingId(null);
    }
  };

  // ─── Sidebar Session Row ──────────────────────────────────────────────────

  const renderSessionRow = (session: ChatSession) => {
    const isActive = session.id === currentSessionId;
    const isConfirmingDelete = deleteConfirmId === session.id;
    const isShared = session.visibility === 'SHARED';

    return (
      <div
        key={session.id}
        onClick={() => !isStreaming && setCurrentSessionId(session.id)}
        className={`group relative flex flex-col p-3 rounded-xl cursor-pointer transition-all mb-0.5 ${
          isActive
            ? 'bg-brand-500/15 border border-brand-500/30 text-white'
            : 'hover:bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare
              className={`w-4 h-4 flex-shrink-0 ${
                isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-400'
              }`}
            />
            <span className="text-xs font-medium truncate">{session.title}</span>
          </div>

          {/* Delete actions */}
          <div className="flex-shrink-0">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-1 bg-slate-900 border border-red-500/30 p-0.5 rounded-md">
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded hover:bg-red-500/30 transition-colors"
                >
                  Del
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                  className="text-[9px] text-slate-400 hover:text-slate-200 px-1 py-0.5"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(session.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-slate-500 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Visibility badge + sharedBy info */}
        <div className="flex items-center gap-1.5 mt-1.5 pl-6">
          <VisibilityBadge visibility={session.visibility} />
          {isShared && session.sharedBy && (
            <span className="text-[9px] text-slate-600 truncate">
              by {session.sharedBy.name}
            </span>
          )}
        </div>
      </div>
    );
  };

  const noSessions = privateSessions.length === 0 && sharedSessions.length === 0;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <div className="w-72 glass rounded-2xl border border-white/8 flex flex-col overflow-hidden flex-shrink-0">
        {/* New Chat button */}
        <div className="p-4 border-b border-white/5">
          <button
            onClick={handleCreateSession}
            disabled={isLoading || isStreaming}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-blue-500 hover:shadow-brand hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Session lists */}
        <div className="flex-1 overflow-y-auto p-2">
          {noSessions ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No conversations yet
            </div>
          ) : (
            <>
              {/* 💬 Private Chats */}
              <SidebarSection label="Private Chats" icon={Lock} count={privateSessions.length}>
                {privateSessions.map(renderSessionRow)}
              </SidebarSection>

              {/* Divider */}
              {sharedSessions.length > 0 && (
                <div className="border-t border-white/5 my-2" />
              )}

              {/* 👥 Shared Discussions */}
              <SidebarSection label="Shared" icon={Users} count={sharedSessions.length}>
                {sharedSessions.map(renderSessionRow)}
              </SidebarSection>
            </>
          )}
        </div>
      </div>

      {/* ─── Main Chat Interface ────────────────────────────────────────────── */}
      <div className="flex-1 glass rounded-2xl border border-white/8 flex flex-col overflow-hidden relative">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-white truncate">
                {activeSession ? activeSession.title : 'AI Grounded Chat'}
              </h1>
              {activeSession && (
                <VisibilityBadge visibility={activeSession.visibility} />
              )}
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-brand-400" />
              {isReadOnly
                ? `Shared by ${activeSession?.user?.name ?? 'workspace member'} · Read only`
                : 'Grounded in active workspace documents'}
            </p>
          </div>

          {/* Share / Unshare button — shown to session owner or Owner/Admin */}
          {activeSession && canShare && (
            <div className="flex items-center gap-2">
              {isSharedSession ? (
                <button
                  onClick={() => handleUnshare(activeSession.id)}
                  disabled={!!sharingId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-white/10 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
                  title="Move back to Private"
                >
                  {sharingId === activeSession.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  Unshare
                </button>
              ) : (
                <button
                  onClick={() => handleShare(activeSession.id)}
                  disabled={!!sharingId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-400 border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 transition-all disabled:opacity-50"
                  title="Share with entire workspace"
                >
                  {sharingId === activeSession.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  Share
                </button>
              )}

              <span className="badge badge-info bg-brand-500/10 text-brand-400 border-brand-500/20 text-[10px] py-0.5 px-2">
                RAG Pipeline
              </span>
            </div>
          )}

          {!activeSession && (
            <span className="badge badge-info bg-brand-500/10 text-brand-400 border-brand-500/20 text-[10px] py-0.5 px-2">
              RAG Pipeline
            </span>
          )}
        </div>

        {/* Read-only banner for shared sessions viewed by non-owners */}
        <AnimatePresence>
          {isReadOnly && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-2 bg-teal-500/10 border-b border-teal-500/20 text-xs text-teal-400 flex items-center gap-2"
            >
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                This is a shared workspace discussion. You can read the conversation but
                cannot send messages — it belongs to{' '}
                <strong>{activeSession?.user?.name ?? 'another member'}</strong>.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gradient-to-b from-[#0f0f1a] to-[#0a0a14]"
        >
          {noSessions ? (
            /* Onboarding: No sessions */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center mb-4 glow-brand">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Start a New Conversation</h3>
              <p className="text-slate-500 text-xs max-w-sm mb-4">
                Ask questions grounded directly in your company documents. Create a chat session on
                the left to start.
              </p>
              <button
                onClick={handleCreateSession}
                className="btn-primary py-2 px-5 rounded-xl font-medium text-xs text-white"
              >
                Create First Chat
              </button>
            </div>
          ) : !currentSessionId ? (
            /* Select a session */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Compass className="w-10 h-10 text-slate-500 mb-3 animate-pulse" />
              <h3 className="text-sm font-semibold text-slate-300">Select a Chat Session</h3>
              <p className="text-slate-500 text-xs mt-1">
                Choose a private chat or browse shared discussions from the sidebar.
              </p>
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            /* Empty chat */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mb-4"
              >
                <Sparkles className="w-5 h-5 text-brand-400" />
              </motion.div>
              <h3 className="text-sm font-semibold text-white">Ask your corporate documents</h3>
              <p className="text-slate-500 text-xs max-w-sm mt-1">
                Ask anything about remote work policies, technical FAQs, handbook rules, or technical
                papers you have uploaded to your Knowledge Base.
              </p>
            </div>
          ) : (
            /* Chat stream */
            <div className="space-y-6">
              {messages.map((message) => {
                const isUser = message.role === 'USER';
                // Show sender name if this is a shared session and there's sender info
                const showSenderName =
                  isUser && isSharedSession && message.sender?.name;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bot avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-brand-400" />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[80%]">
                      {/* Sender name (shared sessions only) */}
                      {showSenderName && (
                        <span className="text-[10px] text-slate-500 mb-1 self-end pr-1">
                          {message.sender!.name}
                        </span>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl text-sm ${
                          isUser
                            ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none'
                            : 'bg-white/5 border border-white/8 text-slate-200 rounded-tl-none prose prose-dark'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </div>

                      {/* Citations */}
                      {!isUser && message.retrievedFrom && message.retrievedFrom.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5 px-1">
                          <span className="text-[10px] font-medium text-slate-500">Sources:</span>
                          {message.retrievedFrom.map((src) => (
                            <div
                              key={src}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-white/5 rounded text-[10px] text-slate-400 font-medium hover:text-slate-200 transition-colors"
                            >
                              <Brain className="w-2.5 h-2.5 text-brand-400" />
                              {src}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* User avatar */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-300 font-semibold text-xs select-none">
                        {message.sender?.name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Streaming AI response */}
              {isStreaming && streamingText.length > 0 && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-brand-400 animate-pulse" />
                  </div>
                  <div className="flex flex-col max-w-[80%]">
                    <div className="px-4 py-3 bg-white/5 border border-white/8 text-slate-200 rounded-2xl rounded-tl-none prose prose-dark">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Thinking indicator */}
              {isStreaming && streamingText.length === 0 && (
                <div className="flex gap-4 justify-start items-center">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-brand-400 animate-spin" />
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-2">
                    Retrieving knowledge &amp; generating response...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error bar */}
        {error && (
          <div className="px-6 py-2 bg-red-500/10 border-t border-b border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Bar — hidden for read-only shared sessions */}
        {currentSessionId && !isReadOnly && (
          <div className="p-4 border-t border-white/5 bg-white/2">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isStreaming}
                placeholder={
                  isStreaming
                    ? 'Wait for response to complete...'
                    : 'Ask a question grounded in your documents...'
                }
                className="flex-1 px-4 py-2.5 rounded-xl text-xs text-white bg-white/5 border border-white/8 placeholder:text-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 transition-all duration-150"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-brand-500 to-blue-500 hover:shadow-brand transition-all flex items-center justify-center disabled:opacity-50 disabled:hover:shadow-none"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
