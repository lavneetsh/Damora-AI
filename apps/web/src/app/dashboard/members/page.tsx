'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  ChevronDown,
  Loader2,
  Lock,
  Clock,
  X,
  Shield,
  Crown,
  Check,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: MemberUser;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
  invitedBy: { id: string; name: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const ROLE_CONFIG = {
  OWNER: { label: 'Owner', icon: Crown, classes: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  ADMIN: { label: 'Admin', icon: Shield, classes: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  MEMBER: { label: 'Member', icon: Users, classes: 'text-slate-300 bg-white/5 border-white/10' },
};

function RoleBadge({ role }: { role: 'OWNER' | 'ADMIN' | 'MEMBER' }) {
  const config = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${config.classes}`}>
      <config.icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({
  workspaceId,
  onClose,
  onSuccess,
}: {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/invites`, { email: email.trim(), role });
      toast.success(`Invitation sent to ${email} as ${role}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Invite Team Member</h2>
              <p className="text-[10px] text-slate-500">They'll receive a notification to accept</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="input-base pl-9"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Assign role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['ADMIN', 'MEMBER'] as const).map((r) => {
                const config = ROLE_CONFIG[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      role === r
                        ? 'border-brand-500/40 bg-brand-500/10 text-white'
                        : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-white'
                    }`}
                  >
                    <config.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{config.label}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {r === 'ADMIN' ? 'Upload & invite users' : 'Chat & search only'}
                      </p>
                    </div>
                    {role === r && <Check className="w-3 h-3 text-brand-400 ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="btn-primary w-full py-3 text-sm mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const userRole = activeWorkspace?.role;
  const isAuthorized = userRole === 'OWNER' || userRole === 'ADMIN';

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchMembers = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ members: Member[]; invites: PendingInvite[] }>(
        `/workspaces/${activeWorkspaceId}/members`,
      );
      setMembers(data.members);
      setInvites(data.invites);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (mounted && isAuthorized) fetchMembers();
  }, [mounted, isAuthorized, fetchMembers]);

  const handleUpdateRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    if (!activeWorkspaceId) return;
    setProcessingId(memberId);
    try {
      await apiClient.patch(`/workspaces/${activeWorkspaceId}/members/${memberId}/role`, { role: newRole });
      toast.success('Role updated');
      setEditingRoleId(null);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to update role');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!activeWorkspaceId) return;
    if (!confirm(`Remove ${memberName} from this workspace?`)) return;
    setProcessingId(memberId);
    try {
      await apiClient.delete(`/workspaces/${activeWorkspaceId}/members/${memberId}`);
      toast.success(`${memberName} removed from workspace`);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to remove member');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelInvite = async (inviteId: string, email: string) => {
    if (!activeWorkspaceId) return;
    setProcessingId(inviteId);
    try {
      await apiClient.delete(`/workspaces/${activeWorkspaceId}/invites/${inviteId}`);
      toast.success(`Invitation to ${email} cancelled`);
      fetchMembers();
    } catch {
      toast.error('Failed to cancel invitation');
    } finally {
      setProcessingId(null);
    }
  };

  if (!mounted) return null;

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center p-10 border border-red-500/10 bg-red-500/3 flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400 text-sm max-w-sm">
            The Members section is accessible to workspace Owners and Admins only.
          </p>
          <div className="mt-4 px-4 py-2 rounded-lg bg-white/3 border border-white/5 text-xs text-slate-500">
            Your role: <span className="text-slate-300 font-semibold">{userRole ?? 'MEMBER'}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            Team Members
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage members in <span className="text-brand-400 font-medium">{activeWorkspace?.name}</span>
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary text-sm px-4 py-2.5"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Members */}
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              Active Members
              <span className="text-xs text-slate-500 font-normal ml-1">({members.length})</span>
            </h2>

            <div className="space-y-2">
              {members.map((member) => {
                const isMe = member.user.id === (activeWorkspace as any)?.currentUserId;
                const isOwner = member.role === 'OWNER';
                const isProcessing = processingId === member.id;
                const isEditingRole = editingRoleId === member.id;

                return (
                  <motion.div
                    key={member.id}
                    layout
                    className="flex items-center gap-4 px-4 py-3 glass-strong rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {getInitials(member.user.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{member.user.name}</span>
                        {isMe && <span className="text-[9px] text-brand-400 font-medium">(you)</span>}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{member.user.email}</p>
                    </div>

                    {/* Role */}
                    <div className="flex-shrink-0">
                      {isEditingRole && !isOwner && userRole === 'OWNER' ? (
                        <div className="flex items-center gap-1.5">
                          {(['ADMIN', 'MEMBER'] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => handleUpdateRole(member.id, r)}
                              disabled={isProcessing}
                              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                                member.role === r
                                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                                  : 'bg-white/5 text-slate-400 border border-white/8 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {isProcessing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : r}
                            </button>
                          ))}
                          <button
                            onClick={() => setEditingRoleId(null)}
                            className="p-1 rounded hover:bg-white/8 text-slate-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <RoleBadge role={member.role} />
                          {!isOwner && userRole === 'OWNER' && (
                            <button
                              onClick={() => setEditingRoleId(member.id)}
                              className="p-1 rounded hover:bg-white/8 text-slate-600 hover:text-slate-300 transition-colors"
                              title="Change role"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Remove button — OWNER only, not self, not other OWNER */}
                    {!isOwner && !isMe && userRole === 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.user.name)}
                        disabled={isProcessing}
                        className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Remove member"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Pending Invites */}
          {(invites.length > 0 || isAuthorized) && (
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Pending Invitations
                {invites.length > 0 && (
                  <span className="text-xs text-slate-500 font-normal ml-1">({invites.length})</span>
                )}
              </h2>

              {invites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-white/8 rounded-xl">
                  <Mail className="w-6 h-6 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500">No pending invitations</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invites.map((invite) => {
                    const isProcessing = processingId === invite.id;
                    return (
                      <div
                        key={invite.id}
                        className="flex items-center gap-4 px-4 py-3 glass-strong rounded-xl border border-amber-500/10 bg-amber-500/2"
                      >
                        {/* Icon */}
                        <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-amber-400" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{invite.email}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Invited by {invite.invitedBy.name} · {new Date(invite.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Role badge */}
                        <RoleBadge role={invite.role} />

                        {/* Cancel button */}
                        <button
                          onClick={() => handleCancelInvite(invite.id, invite.email)}
                          disabled={isProcessing}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                          title="Cancel invitation"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && activeWorkspaceId && (
          <InviteModal
            workspaceId={activeWorkspaceId}
            onClose={() => setShowInviteModal(false)}
            onSuccess={fetchMembers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
