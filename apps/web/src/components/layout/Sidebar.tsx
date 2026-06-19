'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  BarChart2,
  Users,
  Check,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { InvitationBell } from './InvitationBell';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'text-violet-400',
  ADMIN: 'text-blue-400',
  MEMBER: 'text-slate-400',
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { workspaces, activeWorkspaceId, setActiveWorkspace, fetchInvites } = useWorkspaceStore();
  const [workspaceSelectorOpen, setWorkspaceSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const userRole = activeWorkspace?.role;
  const isAdminOrOwner = userRole === 'OWNER' || userRole === 'ADMIN';

  // Fetch invites on mount
  useEffect(() => {
    fetchInvites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close workspace selector on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setWorkspaceSelectorOpen(false);
      }
    };
    if (workspaceSelectorOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [workspaceSelectorOpen]);

  const handleSwitchWorkspace = (workspaceId: string) => {
    setActiveWorkspace(workspaceId);
    setWorkspaceSelectorOpen(false);
    // Navigate to dashboard to reload workspace context
    router.push('/dashboard');
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    router.push('/');
  };

  // Build nav items dynamically based on role
  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Knowledge Base', href: '/dashboard/documents', icon: FileText },
    { label: 'AI Chat', href: '/dashboard/chat', icon: MessageSquare },
    { label: 'Search', href: '/dashboard/search', icon: Search },
    ...(isAdminOrOwner
      ? [
          { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
          { label: 'Members', href: '/dashboard/members', icon: Users },
        ]
      : []),
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0d0d1c] border-r border-white/5 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <img src="/logo.png" alt="Damora AI Logo" className="w-8 h-8 rounded-lg object-cover glow-brand" />
        <div>
          <div className="text-sm font-bold gradient-text">Damora AI</div>
          <div className="text-[10px] text-slate-600">Private AI Workspace</div>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="px-3 py-3 border-b border-white/5" ref={selectorRef}>
        <button
          onClick={() => setWorkspaceSelectorOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs font-medium text-white truncate">
              {activeWorkspace?.name ?? `${user?.name}'s Workspace`}
            </div>
            <div className="text-[9px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <span className={`font-bold ${ROLE_BADGE[userRole ?? 'MEMBER']}`}>
                {userRole ?? 'MEMBER'}
              </span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500">{activeWorkspace?.plan ?? 'FREE'}</span>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-all',
              workspaceSelectorOpen && 'rotate-180',
            )}
          />
        </button>

        {/* Workspace Dropdown */}
        <AnimatePresence>
          {workspaceSelectorOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-1 py-1 space-y-0.5">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
                      ws.id === activeWorkspaceId
                        ? 'bg-brand-500/15 text-white'
                        : 'hover:bg-white/5 text-slate-400 hover:text-white',
                    )}
                  >
                    <div className="w-5 h-5 rounded bg-white/8 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-slate-300">
                      {ws.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ws.name}</p>
                      <p className={`text-[9px] font-semibold ${ROLE_BADGE[ws.role ?? 'MEMBER']}`}>
                        {ws.role}
                      </p>
                    </div>
                    {ws.id === activeWorkspaceId && (
                      <Check className="w-3 h-3 text-brand-400 flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Create workspace button */}
                <button
                  onClick={() => {
                    setWorkspaceSelectorOpen(false);
                    // Future: open create workspace modal
                    toast('Create workspace — coming soon!', { icon: '🚧' });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <div className="w-5 h-5 rounded border border-dashed border-white/15 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-2.5 h-2.5" />
                  </div>
                  <span className="text-xs">Create Workspace</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative group border',
                isActive
                  ? 'text-white bg-brand-500/20 border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-brand-500/10"
                  transition={{ duration: 0.2 }}
                />
              )}
              <item.icon
                className={cn(
                  'w-4 h-4 relative z-10 transition-colors',
                  isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300',
                )}
              />
              <span className="relative z-10 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile + Invitation Bell */}
      <div className="px-3 py-4 border-t border-white/5">
        {/* Invitation Bell */}
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Notifications</span>
          <InvitationBell />
        </div>

        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user ? getInitials(user.name) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">{user?.name}</div>
            <div className="text-[10px] text-slate-600 truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
