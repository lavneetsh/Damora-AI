'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a letter', test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: 'Contains a number', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    workspaceName: '',
  });
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        workspaceName: form.workspaceName || undefined,
      });
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('just_registered', 'true');
      }
      toast.success('Workspace created! Welcome to Damora AI 🎉');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/15 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Damora AI Logo" className="w-12 h-12 rounded-2xl object-cover glow-brand mb-4" />
          <h1 className="text-2xl font-bold gradient-text">Create Workspace</h1>
          <p className="text-slate-400 text-sm mt-1">Your private AI workspace in seconds</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Full name
              </label>
              <input
                id="register-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Smith"
                className="input-base"
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Work email
              </label>
              <input
                id="register-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@acme.com"
                className="input-base"
                required
                autoComplete="email"
              />
            </div>

            {/* Workspace Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Workspace name{' '}
                <span className="text-slate-600 font-normal">(optional)</span>
              </label>
              <input
                id="register-workspace"
                type="text"
                value={form.workspaceName}
                onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
                placeholder="Acme Corp"
                className="input-base"
                autoComplete="organization"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Create a strong password"
                  className="input-base pr-12"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password requirements */}
              {(focused || form.password.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-1.5"
                >
                  {passwordRequirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 transition-colors ${
                          req.test(form.password)
                            ? 'text-emerald-400'
                            : 'text-slate-600'
                        }`}
                      />
                      <span
                        className={`text-xs transition-colors ${
                          req.test(form.password)
                            ? 'text-emerald-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating workspace...
                </>
              ) : (
                <>
                  Create Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-3 text-[11px] text-slate-600 text-center">
            By creating an account, you agree to our Terms of Service.
          </p>

          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
