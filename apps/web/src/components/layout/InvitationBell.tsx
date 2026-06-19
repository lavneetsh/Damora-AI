'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, Building2, Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  MEMBER: 'text-slate-300 bg-white/5 border-white/10',
};

export function InvitationBell() {
  const { invites, invitesLoading, fetchInvites, acceptInvite, declineInvite } =
    useWorkspaceStore();
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleAccept = async (inviteId: string, workspaceName: string) => {
    setProcessingId(inviteId);
    try {
      await acceptInvite(inviteId);
      toast.success(`Joined ${workspaceName}! 🎉`);
    } catch {
      toast.error('Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      await declineInvite(inviteId);
      toast.success('Invitation declined');
    } catch {
      toast.error('Failed to decline invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const count = invites.length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchInvites();
        }}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 text-slate-500 hover:text-slate-300 transition-colors"
        title="Workspace Invitations"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-500 text-[9px] font-bold text-white flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 bottom-10 w-80 glass border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-xs font-semibold text-white">Workspace Invitations</span>
              </div>
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-medium">
                  {count} pending
                </span>
              )}
            </div>

            {/* Content */}
            <div className="max-h-72 overflow-y-auto">
              {invitesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                </div>
              ) : count === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-500">No pending invitations</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {invites.map((invite) => {
                    const isProcessing = processingId === invite.id;
                    return (
                      <div
                        key={invite.id}
                        className="glass-strong rounded-xl border border-white/8 p-3"
                      >
                        {/* Workspace info */}
                        <div className="flex items-start gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-brand-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {invite.workspace.name}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Invited by <span className="text-slate-400">{invite.invitedBy.name}</span>
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${
                              ROLE_COLORS[invite.role] ?? ROLE_COLORS.MEMBER
                            }`}
                          >
                            {invite.role}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(invite.id, invite.workspace.name)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(invite.id)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-slate-400 hover:text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
