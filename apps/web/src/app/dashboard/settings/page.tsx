'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Key,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString();
  } catch {
    return '';
  }
}

function getProviderName(p: string) {
  if (p === 'gemini') return 'Google Gemini';
  if (p === 'openai') return 'OpenAI';
  if (p === 'claude') return 'Anthropic Claude';
  return p;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { workspaces, activeWorkspaceId, updateAiSettings, testAiConnection } = useWorkspaceStore();

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isOwner = activeWorkspace?.role === 'OWNER';

  const [workspaceDetails, setWorkspaceDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form State
  const [provider, setProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'CONNECTED' | 'FAILED' | 'NOT_CONFIGURED'>('NOT_CONFIGURED');
  const [lastTested, setLastTested] = useState<string | null>(null);

  const fetchWorkspaceDetails = useCallback(async () => {
    if (!activeWorkspaceId || !isOwner) return;
    setLoadingDetails(true);
    try {
      const { data } = await apiClient.get(`/workspaces/${activeWorkspaceId}`);
      setWorkspaceDetails(data);
      setProvider(data.aiProvider || '');
      setStatus(data.aiConnectionStatus || 'NOT_CONFIGURED');
      setLastTested(data.aiLastTested || null);
      setApiKey(''); // reset key input field
    } catch {
      toast.error('Failed to load workspace AI configuration');
    } finally {
      setLoadingDetails(false);
    }
  }, [activeWorkspaceId, isOwner]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    fetchWorkspaceDetails();
  }, [fetchWorkspaceDetails]);

  const handleTestConnection = async () => {
    if (!activeWorkspaceId) return;
    setTesting(true);
    try {
      const response = await testAiConnection(
        activeWorkspaceId,
        provider,
        apiKey || undefined, // undefined forces backend to test saved key
      );
      toast.success('Connection test successful!');
      setStatus('CONNECTED');
      setLastTested(response.lastTested || new Date().toISOString());
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Connection test failed';
      toast.error(msg);
      setStatus('FAILED');
      setLastTested(new Date().toISOString());
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!activeWorkspaceId) return;
    setSaving(true);
    try {
      const finalProvider = provider || null;
      const finalKey = provider ? (apiKey || undefined) : null;

      const res = await updateAiSettings(activeWorkspaceId, finalProvider, finalKey);
      toast.success('AI settings updated successfully!');
      
      setWorkspaceDetails(res);
      setProvider(res.aiProvider || '');
      setStatus(res.aiConnectionStatus || 'NOT_CONFIGURED');
      setLastTested(res.aiLastTested || null);
      setApiKey('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save settings';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and workspace credentials</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Profile */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-400" />
            Profile Card
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Name</label>
              <input
                type="text"
                defaultValue={user?.name}
                className="input-base"
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                defaultValue={user?.email}
                className="input-base"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* AI Configuration — restricted to OWNER */}
        {isOwner ? (
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-400" />
                  AI Configuration (BYOK)
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Configure custom AI credentials for <span className="text-brand-400 font-semibold">{activeWorkspace?.name}</span>.
                </p>
              </div>

              {/* Usage Warning / Info Badge */}
              <div className="flex-shrink-0">
                {activeWorkspace?.aiProvider ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Using Workspace Key
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Using Damora Key
                  </span>
                )}
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {/* Active Credentials Warning Card */}
                <div className="glass-strong rounded-xl p-4 flex gap-3 border border-white/5">
                  <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    {provider ? (
                      <span>
                        <strong>Workspace Key Isolation is Active</strong>. AI features in this workspace will execute using your custom {getProviderName(provider)} credentials. Users will not see or have access to this key.
                      </span>
                    ) : (
                      <span>
                        <strong>System Default Active</strong>. This workspace uses Damora's global shared API keys. Uploaded documents and chats will be processed using the host server's key config.
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Provider Dropdown */}
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">AI Provider Mode</label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      setApiKey('');
                    }}
                    className="input-base cursor-pointer"
                  >
                    <option value="">Use System Key (Default)</option>
                    <option value="gemini">Google Gemini (Bring Your Own Key)</option>
                    <option value="openai">OpenAI (Bring Your Own Key)</option>
                    <option value="claude">Anthropic Claude (Bring Your Own Key)</option>
                  </select>
                </div>

                {/* API Key Input */}
                {provider && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-1"
                  >
                    <div>
                      <label className="block text-xs text-slate-300 font-medium mb-1.5">{getProviderName(provider)} API Key</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={
                          workspaceDetails?.hasAiApiKey && workspaceDetails?.aiProvider === provider
                            ? '••••••••••••••••••••••••••••••••'
                            : `Enter custom ${getProviderName(provider)} API key`
                        }
                        className="input-base font-mono"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Status Indicator & Validated Timestamp */}
                {provider && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/3 rounded-xl border border-white/5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Connection Status:</span>
                      {status === 'CONNECTED' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Connected
                        </span>
                      )}
                      {status === 'FAILED' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Invalid Key
                        </span>
                      )}
                      {status === 'NOT_CONFIGURED' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Not Tested
                        </span>
                      )}
                    </div>

                    {lastTested && (
                      <div className="text-slate-500 text-[10px]">
                        Last Verified: <span className="text-slate-400 font-medium">{formatDate(lastTested)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  {provider && (
                    <button
                      onClick={handleTestConnection}
                      disabled={
                        testing ||
                        saving ||
                        (!apiKey && !(workspaceDetails?.hasAiApiKey && workspaceDetails?.aiProvider === provider))
                      }
                      className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Test Connection
                    </button>
                  )}
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving || testing}
                    className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Locked screen / lock card for non-owners (ADMIN / MEMBER) */
          <div className="card text-center py-8 border border-white/5 bg-white/2 flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-slate-500" />
            </div>
            <h3 className="text-xs font-bold text-slate-300">Infrastructure Settings Locked</h3>
            <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
              Only the workspace Owner role can modify custom AI provider configurations and keys.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
