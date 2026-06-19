'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const { fetchWorkspaces, fetchInvites } = useWorkspaceStore();

  // ─── Auth Guard ───────────────────────────────────────────────────────────
  // IMPORTANT: We must wait for _hasHydrated before redirecting.
  //
  // Without this check, the flow on hard refresh is:
  //   1. React renders with initial state: { isAuthenticated: false } (Zustand hasn't read localStorage yet)
  //   2. Guard fires → redirects to /login  ← BUG: user gets logged out!
  //   3. ~50ms later: Zustand hydrates → isAuthenticated: true  (too late)
  //
  // With the check:
  //   1. React renders → _hasHydrated: false → show loading spinner, do NOT redirect
  //   2. ~1 render later: onRehydrateStorage fires → _hasHydrated: true, isAuthenticated: true
  //   3. Guard re-runs → user is authenticated → stay on dashboard ✅
  useEffect(() => {
    if (!_hasHydrated) return; // wait for localStorage to be read first
    if (!isAuthenticated || !user) {
      router.replace('/login');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  // Load workspaces and invitations once auth is confirmed
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user) {
      fetchWorkspaces();
      fetchInvites();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, isAuthenticated, user]);

  // Show loading spinner while Zustand is hydrating from localStorage
  // (this is the window where the old code incorrectly redirected)
  if (!_hasHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-slate-400 text-sm">
            {!_hasHydrated ? 'Loading...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <div className="min-h-screen p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
